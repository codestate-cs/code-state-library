import {
  ConfigurableLogger,
  GetConfig,
  GitService,
  ListSessions,
  OpenFiles,
  OpenIDE,
  ResumeSession,
  SaveSession,
  UpdateSession,
  Terminal,
  ApplyStash,
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
    const sessionResult = await resumeSession.execute(targetSession);
    if (!sessionResult.ok) {
      logger.error("Failed to load session", { error: sessionResult.error });
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
      logger.error("Failed to get Git status", {
        error: gitStatusResult.error,
      });
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
        logger.error("Failed to apply stash", {
          error: stashResult.ok ? stashResult.value.error : stashResult.error,
        });
      }
    }

    // 5. Restore terminal commands (NEW)
    if ((session as any).terminalCommands && (session as any).terminalCommands.length > 0) {
      logger.plainLog("Restoring terminal commands...");
      
      // Sort terminals by terminalId to ensure correct order
      const sortedTerminals = [...(session as any).terminalCommands].sort((a: any, b: any) => a.terminalId - b.terminalId);
      
      for (const terminalState of sortedTerminals) {
        // Sort commands within terminal by priority
        const sortedCommands = [...terminalState.commands].sort((a: any, b: any) => a.priority - b.priority);
        
        for (const terminalCmd of sortedCommands) {
          const spawnResult = await terminal.spawnTerminal(terminalCmd.command, {
            cwd: session.projectRoot,
            timeout: 5000, // Short timeout for spawning
          });

          if (!spawnResult.ok) {
            logger.error(
              `Failed to spawn terminal for command: ${terminalCmd.command}`,
              {
                error: spawnResult.error,
                terminalId: terminalState.terminalId,
                commandName: terminalCmd.name,
              }
            );
          } else {
            logger.plainLog(`  Terminal ${terminalState.terminalId} (${terminalState.terminalName || 'unnamed'}): ${terminalCmd.name} - ${terminalCmd.command}`);
          }

          // Small delay between spawning terminals to avoid overwhelming the system
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } else {
      logger.plainLog("No terminal commands to restore.");
    }

    // 6. Open IDE and files (UPDATED to use position order)

    // Get configured IDE from config
    const getConfig = new GetConfig();
    const configResult = await getConfig.execute();
    if (configResult.ok && configResult.value.ide) {
      const configuredIDE = configResult.value.ide;

      // Open IDE with project
      const openIDE = new OpenIDE();
      const ideResult = await openIDE.execute(
        configuredIDE,
        session.projectRoot
      );

      if (ideResult.ok) {
        logger.log(`IDE '${configuredIDE}' opened successfully`);

        // Open files if session has files (UPDATED: Sort by position)
        if (session.files && session.files.length > 0) {
          const openFiles = new OpenFiles();
          
          // Sort files by position if available, otherwise keep original order
          const sortedFiles = [...session.files].sort((a, b) => {
            const posA = (a as any).position ?? Number.MAX_SAFE_INTEGER;
            const posB = (b as any).position ?? Number.MAX_SAFE_INTEGER;
            return posA - posB;
          });

          const filesResult = await openFiles.execute({
            ide: configuredIDE,
            projectRoot: session.projectRoot,
            files: sortedFiles.map((file) => ({
              path: file.path,
              line: file.cursor?.line,
              column: file.cursor?.column,
              isActive: file.isActive,
            })),
          });

          if (filesResult.ok) {
            logger.plainLog(`Opened ${sortedFiles.length} files in correct order`);
          } else {
            logger.error("Failed to open files in IDE", {
              error: filesResult.error,
            });
          }
        } else {
          logger.plainLog("No files to open from session");
        }
      } else {
        logger.error(`Failed to open IDE '${configuredIDE}'`, {
          error: ideResult.error,
        });
        logger.warn("Continuing without IDE...");
      }
    } else {
      logger.warn("No IDE configured. Files will not be opened automatically.");
    }

    // 7. Update session metadata (last accessed)

    // TODO: Implement session metadata update

    logger.log(`\n✅ Session "${session.name}" resumed successfully!`);
    if (session.notes) {
      logger.plainLog(`\n📝 Notes: ${session.notes}`);
    }
    if (session.tags.length > 0) {
      logger.plainLog(`🏷️  Tags: ${session.tags.join(", ")}`);
    }
  } catch (error) {
    logger.error("Unexpected error during session resume", { error });
  }
}
