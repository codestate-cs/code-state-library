import { ConfigurableLogger, GitService, UpdateSession, ListSessions, Terminal, ListTerminalCollections, GetScripts } from "@codestate/core";
import inquirer from "../../utils/inquirer";
import {
  getCurrentGitState,
  promptDirtyState,
  promptSessionDetails,
} from "./utils";

export async function updateSessionCommand(sessionIdOrName?: string) {
  const logger = new ConfigurableLogger();
  const updateSession = new UpdateSession();
  const gitService = new GitService();
  const terminal = new Terminal();

  try {
    // If no session specified, ask user to select one
    let targetSession = sessionIdOrName;
    if (!targetSession) {
      const listSessions = new ListSessions();
      const sessionsResult = await listSessions.execute();

      if (!sessionsResult.ok || sessionsResult.value.length === 0) {
        logger.warn("No saved sessions found.");
        return;
      }

      const sessions = sessionsResult.value;
      const { selectedSession } = await inquirer.customPrompt([
        {
          type: "list",
          name: "selectedSession",
          message: "Select a session to update:",
          choices: sessions.map((s) => ({
            name: `${s.name} (${s.projectRoot})`,
            value: s.id,
          })),
        },
      ]);
      targetSession = selectedSession || "";
    }

    // Ensure targetSession is not empty
    if (!targetSession || !targetSession.trim()) {
      logger.plainLog("No session specified. Update cancelled.");
      return;
    }

    // 1. Load existing session and validate
    const sessionResult = await updateSession.execute(targetSession, {});
    if (!sessionResult.ok) {
      logger.error("Failed to load session");
      return;
    }

    const session = sessionResult.value;
    logger.plainLog(`\n📋 Updating session: "${session.name}"`);
    logger.plainLog(` Project: ${session.projectRoot}`);
    logger.plainLog(` Branch: ${session.git.branch}`);
    logger.plainLog(` Commit: ${session.git.commit}`);

    // Check if we're in the correct directory
    const currentDir = process.cwd();
    if (currentDir !== session.projectRoot) {
      logger.warn(`You are in ${currentDir}`);
      logger.plainLog(`Session was saved from ${session.projectRoot}`);
      const { changeDirectory } = await inquirer.customPrompt([
        {
          type: "confirm",
          name: "changeDirectory",
          message: "Do you want to change to the session directory?",
          default: true,
        },
      ]);
      if (changeDirectory) {
        logger.plainLog(`Changing to ${session.projectRoot}...`);
        process.chdir(session.projectRoot);
      } else {
        logger.plainLog("Continuing in current directory...");
      }
    }

    // 2. Check current Git status
    const isRepoResult = await gitService.isGitRepository();
    if (!isRepoResult.ok || !isRepoResult.value) {
      logger.warn("Current directory is not a Git repository.");
      logger.plainLog("Cannot update Git state. Session update cancelled.");
      return;
    }

    const gitStatusResult = await gitService.getStatus();
    if (!gitStatusResult.ok) {
      logger.error("Failed to get Git status");
      return;
    }
    const gitStatus = gitStatusResult.value;

    // 3. Handle current repository dirty state
    if (gitStatus.isDirty) {
      logger.warn("Current repository has uncommitted changes:");
      gitStatus.dirtyFiles.forEach((file) => {
        logger.plainLog(`  ${file.status}: ${file.path}`);
      });

      // Check if we can stash (only modified files, no new/deleted files)
      const hasNewFiles = gitStatus.newFiles.length > 0;
      const hasDeletedFiles = gitStatus.deletedFiles.length > 0;
      const hasUntrackedFiles = gitStatus.untrackedFiles.length > 0;
      const canStash = !hasNewFiles && !hasDeletedFiles && !hasUntrackedFiles;

      const { dirtyAction } = await promptDirtyState(gitStatus, canStash);
      if (dirtyAction === "cancel") {
        logger.warn("Session update cancelled.");
        return;
      }

      if (dirtyAction === "commit") {
        const { commitMessage } = await inquirer.customPrompt([
          {
            type: "input",
            name: "commitMessage",
            message: "Enter commit message:",
            validate: (input: string) => {
              if (!input.trim()) {
                return "Commit message is required";
              }
              return true;
            },
          },
        ]);

        logger.plainLog(" Committing changes...");
        const commitResult = await gitService.commitChanges(commitMessage);
        if (!commitResult.ok) {
          logger.error("Failed to commit changes");
          logger.warn("Session update cancelled.");
          return;
        }
        logger.plainLog(" Changes committed successfully");
      } else if (dirtyAction === "stash") {
        logger.plainLog("Stashing changes...");
        const stashResult = await gitService.createStash(
          "Session update stash"
        );
        if (!stashResult.ok) {
          logger.error("Failed to stash changes");
          logger.warn("Session update cancelled.");
          return;
        }
        if (!stashResult.value.success) {
          logger.error("Failed to stash changes");
          logger.warn("Session update cancelled.");
          return;
        }
        logger.plainLog("Changes stashed successfully");
      }
    }

    // 4. Capture current Git state
    const gitState = await getCurrentGitState(gitService, logger);
    if (!gitState) {
      logger.error("Failed to capture Git state");
      return;
    }

    // 5. Get available terminal collections for selection
    const listTerminalCollections = new ListTerminalCollections();
    const terminalCollectionsResult = await listTerminalCollections.execute();
    const terminalCollectionChoices = terminalCollectionsResult.ok 
      ? terminalCollectionsResult.value.map(tc => ({ 
          name: `${tc.name} (${tc.rootPath})`, 
          value: tc.id 
        }))
      : [];

    // 6. Get available scripts for selection
    const getScripts = new GetScripts();
    const scriptsResult = await getScripts.execute();
    const scriptChoices = scriptsResult.ok 
      ? scriptsResult.value.map(script => ({ 
          name: `${script.name} (${script.rootPath})`, 
          value: script.id 
        }))
      : [];

    // 7. Ask user for new notes, tags, terminal collections, and scripts (pre-populate with existing values)
    const sessionDetails = await promptSessionDetails({
      name: session.name, // Session name is immutable
      notes: session.notes || "",
      tags: session.tags.join(", "), // Convert array to string for prompt
      terminalCollectionChoices,
      scriptChoices,
    });

    // 8. Update session with new data (keep same ID and name)
    const updateResult = await updateSession.execute(targetSession, {
      notes: sessionDetails.sessionNotes,
      tags: sessionDetails.sessionTags
        .split(",")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0),
      git: gitState,
      files: [], // Empty array in CLI mode
      extensions: {},
      terminalCollections: sessionDetails.terminalCollections || [],
      scripts: sessionDetails.scripts || [],
    });

    if (!updateResult.ok) {
      logger.error("Failed to update session");
      return;
    }

    const updatedSession = updateResult.value;
    logger.log(`\nSession "${updatedSession.name}" updated successfully!`);

    if (updatedSession.notes) {
      logger.plainLog(`\n📝 Notes: ${updatedSession.notes}`);
    }
    if (updatedSession.tags.length > 0) {
      logger.plainLog(`🏷️  Tags: ${updatedSession.tags.join(", ")}`);
    }
    if (updatedSession.terminalCollections && updatedSession.terminalCollections.length > 0) {
      logger.plainLog(`🖥️  Terminal Collections: ${updatedSession.terminalCollections.length} collection(s)`);
    }
    if (updatedSession.scripts && updatedSession.scripts.length > 0) {
      logger.plainLog(`📜 Scripts: ${updatedSession.scripts.length} script(s)`);
    }
  } catch (error) {
    logger.error("Unexpected error during session update");
  }
}
