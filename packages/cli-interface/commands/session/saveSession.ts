import {
  ConfigurableLogger,
  GitService,
  SaveSession,
  Terminal,
} from "@codestate/core";
import inquirer from "../../utils/inquirer";
import {
  getCurrentGitState,
  handleSessionSave,
  promptDirtyState,
  promptSessionDetails,
} from "./utils";

export async function saveSessionCommand() {
  const logger = new ConfigurableLogger();
  const saveSession = new SaveSession();
  const gitService = new GitService();

  try {
    // Check if we're in a Git repository first
    const isRepoResult = await gitService.isGitRepository();
    if (!isRepoResult.ok || !isRepoResult.value) {
      logger.warn("Current directory is not a Git repository.");
      const { continueWithoutGit } = await inquirer.customPrompt([
        {
          type: "confirm",
          name: "continueWithoutGit",
          message: "Do you want to continue without Git integration?",
          default: false,
        },
      ]);
      if (!continueWithoutGit) {
        logger.warn("Session save cancelled.");
        return;
      }
      const sessionDetails = await promptSessionDetails();
      const projectRoot = process.cwd();
      await handleSessionSave({
        sessionDetails,
        projectRoot,
        git: {
          branch: "no-git",
          commit: "no-git",
          isDirty: false,
          stashId: null,
        },
        saveSession,
        logger,
      });
      return;
    }

    // 1. Check current Git status
    const gitStatusResult = await gitService.getStatus();
    if (!gitStatusResult.ok) {
      logger.error("Failed to get Git status", {
        error: gitStatusResult.error,
      });
      return;
    }
    const gitStatus = gitStatusResult.value;

    // 2. Handle dirty repository
    if (gitStatus.isDirty) {
      logger.warn("⚠️ Repository has uncommitted changes:");
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
        logger.warn("Session save cancelled.");
        return;
      }
      if (dirtyAction === "commit") {
        // Check if Git is properly configured first
        const configResult = await gitService.isGitConfigured();
        if (!configResult.ok) {
          logger.error("Failed to check Git configuration", {
            error: configResult.error,
          });
          logger.warn("Session save cancelled.");
          return;
        }

        if (!configResult.value) {
          logger.error("Git is not properly configured for commits.");
          logger.warn("Please configure Git with your name and email:");
          logger.warn('  git config --global user.name "Your Name"');
          logger.warn(
            '  git config --global user.email "your.email@example.com"'
          );

          const { configureGit } = await inquirer.customPrompt([
            {
              type: "confirm",
              name: "configureGit",
              message: "Would you like to configure Git now?",
              default: false,
            },
          ]);

          if (configureGit) {
            const { userName, userEmail } = await inquirer.customPrompt([
              {
                type: "input",
                name: "userName",
                message: "Enter your name for Git:",
                validate: (input: string) => {
                  if (!input.trim()) {
                    return "Name is required";
                  }
                  return true;
                },
              },
              {
                type: "input",
                name: "userEmail",
                message: "Enter your email for Git:",
                validate: (input: string) => {
                  if (!input.trim()) {
                    return "Email is required";
                  }
                  return true;
                },
              },
            ]);

            // Configure Git
            const terminal = new Terminal();
            await terminal.execute(`git config user.name "${userName}"`);
            await terminal.execute(`git config user.email "${userEmail}"`);
            logger.log("Git configured successfully.");
          } else {
            logger.warn("Session save cancelled.");
            return;
          }
        }

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

        logger.log(" Committing changes...");
        const commitResult = await gitService.commitChanges(commitMessage);
        if (!commitResult.ok) {
          logger.error("Failed to commit changes", {
            error: commitResult.error,
            message: commitResult.error.message,
          });

          // Provide more specific error messages
          logger.warn("Git commit failed. This might be due to:");
          logger.warn("  - No changes to commit");
          logger.warn("  - Git configuration issues");
          logger.warn("  - Repository permissions");
          logger.warn(
            'Consider using "stash" instead or check your git status.'
          );

          const { retryAction } = await inquirer.customPrompt([
            {
              type: "list",
              name: "retryAction",
              message: "What would you like to do?",
              choices: [
                { name: "Try stashing instead", value: "stash" },
                { name: "Cancel session save", value: "cancel" },
              ],
            },
          ]);

          if (retryAction === "stash") {
            logger.log("Attempting to stash changes...");
            const stashResult = await gitService.createStash(
              "Session save stash"
            );
            if (!stashResult.ok) {
              logger.error("Failed to stash changes", {
                error: stashResult.error,
              });
              logger.warn("Session save cancelled.");
              return;
            }
            logger.log("Changes stashed successfully.");
          } else {
            logger.warn("Session save cancelled.");
            return;
          }
        } else {
          logger.log(" Changes committed successfully.");
        }
      } else if (dirtyAction === "stash") {
        const stashResult = await gitService.createStash("Session save stash");
        if (!stashResult.ok) {
          logger.error("Failed to stash changes", { error: stashResult.error });
          return;
        }
      }
    }

    // 3. Capture current Git state
    const gitState = await getCurrentGitState(gitService, logger);
    if (!gitState) return;

    // 4. Get user input for session details
    const sessionDetails = await promptSessionDetails();
    const projectRoot = process.cwd();
    await handleSessionSave({
      sessionDetails,
      projectRoot,
      git: {
        ...gitState,
        isDirty: false,
        stashId: null,
      },
      saveSession,
      logger,
    });
  } catch (error) {
    logger.error("Unexpected error during session save", { error });
  }
}
