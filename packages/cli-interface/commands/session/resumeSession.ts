import {
  ConfigurableLogger,
  GitService,
  ListSessions,
  GetSession,
  ResumeSession,
  SaveSession,
  UpdateSession,
  Terminal,
  ApplyStash,
  CommitChanges,
} from "@codestate/core";
import inquirer from "../../utils/inquirer";
import {
  getCurrentGitState,
  handleSessionSave,
  promptDirtyState,
  promptSessionDetails,
} from "./utils";

export async function resumeSessionCommand(sessionIdOrName?: string) {
  const logger = new ConfigurableLogger();
  const resumeSession = new ResumeSession();
  const gitService = new GitService();
  const listSessions = new ListSessions();
  const saveSession = new SaveSession();
  const updateSession = new UpdateSession();
  const terminal = new Terminal();

  try {
    // If no session specified, ask user to select one
    let targetSession = sessionIdOrName;
    if (!targetSession) {
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
          message: "Select a session to resume:",
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
      logger.plainLog("No session specified. Resume cancelled.");
      return;
    }

    // 1. Load session file and validate
    const getSession = new GetSession();
    const sessionResult = await getSession.execute(targetSession);
    if (!sessionResult.ok) {
      logger.error("Failed to load session");
      return;
    }

    const session = sessionResult.value;
    logger.plainLog(`\n📋 Resuming session: "${session.name}"`);

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
      logger.plainLog(
        "Cannot restore Git state. Session resumed without Git integration."
      );
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
        logger.warn("Session resume cancelled.");
        return;
      }
      if (dirtyAction === "save") {
        logger.plainLog("Saving current work as new session...");
        const sessionDetails = await promptSessionDetails();
        const gitState = await getCurrentGitState(gitService, logger);
        if (!gitState) return;
        await handleSessionSave({
          sessionDetails,
          projectRoot: process.cwd(),
          git: {
            ...gitState,
            isDirty: false,
            stashId: null,
          },
          saveSession,
          logger,
        });
        logger.plainLog("Current work saved. Proceeding with resume...");
      } else if (dirtyAction === "commit") {
        logger.plainLog("Committing current changes...");
        
        // Ask user for commit message
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
        
        // Use the CommitChanges use case
        const commitChanges = new CommitChanges();
        const commitResult = await commitChanges.execute(commitMessage);
        
        if (!commitResult.ok) {
          logger.error("Failed to commit changes");
          logger.plainLog(`Commit error: ${commitResult.error?.message || 'Unknown error'}`);
          return;
        }
        
        logger.log("Changes committed successfully. Proceeding with resume...");
      } else if (dirtyAction === "discard") {
        await terminal.execute("git reset --hard");
        await terminal.execute("git clean -fd");
        logger.plainLog("Changes discarded. Proceeding with resume...");
      }
    }

    // 4. Restore Git state
    const currentBranchResult = await gitService.getCurrentBranch();
    if (
      currentBranchResult.ok &&
      currentBranchResult.value !== session.git.branch
    ) {
      await terminal.execute(`git checkout ${session.git.branch}`);
    }

    if (session.git.stashId) {
      logger.plainLog(`Applying stash ${session.git.stashId}...`);
      const applyStash = new ApplyStash();
      const stashResult = await applyStash.execute(session.git.stashId);
      if (stashResult.ok && stashResult.value.success) {
      } else {
        logger.error("Failed to apply stash");
      }
    }

    // 5. Execute the ResumeSession use case (handles IDE, files, terminals, scripts)
    const resumeSessionResult = await resumeSession.execute(targetSession);
    if (!resumeSessionResult.ok) {
      logger.error("Failed to resume session");
      return;
    }

    // 6. Update session metadata (last accessed)
    // TODO: Implement session metadata update
  } catch (error) {
    logger.error("Unexpected error during session resume");
  }
}
