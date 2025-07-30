import { SaveSession, ConfigurableLogger, GitService } from '@codestate/cli-api/main';
import inquirer from '../../utils/inquirer';
import {
  promptSessionDetails,
  promptDirtyState,
  getCurrentGitState,
  handleSessionSave
} from './utils';

export async function saveSessionCommand() {
  const logger = new ConfigurableLogger();
  const saveSession = new SaveSession();
  const gitService = new GitService();

  try {
    // Check if we're in a Git repository first
    const isRepoResult = await gitService.isGitRepository();
    if (!isRepoResult.ok || !isRepoResult.value) {
      logger.warn('Current directory is not a Git repository.');
      const { continueWithoutGit } = await inquirer.customPrompt([
        {
          type: 'confirm',
          name: 'continueWithoutGit',
          message: 'Do you want to continue without Git integration?',
          default: false
        }
      ]);
      if (!continueWithoutGit) {
        logger.warn('Session save cancelled.');
        return;
      }
      logger.plainLog('Continuing without Git integration...');
      const sessionDetails = await promptSessionDetails();
      const projectRoot = process.cwd();
      await handleSessionSave({
        sessionDetails,
        projectRoot,
        git: {
          branch: 'no-git',
          commit: 'no-git',
          isDirty: false,
          stashId: null
        },
        saveSession,
        logger
      });
      return;
    }

    // 1. Check current Git status
    const gitStatusResult = await gitService.getStatus();
    if (!gitStatusResult.ok) {
      logger.error('Failed to get Git status', { error: gitStatusResult.error });
      return;
    }
    const gitStatus = gitStatusResult.value;

    // 2. Handle dirty repository
    if (gitStatus.isDirty) {
      logger.warn('Repository has uncommitted changes:');
      gitStatus.dirtyFiles.forEach(file => {
        logger.log(`  ${file.status}: ${file.path}`);
      });
      // Check if we can stash (only modified files, no new/deleted files)
      const hasNewFiles = gitStatus.newFiles.length > 0;
      const hasDeletedFiles = gitStatus.deletedFiles.length > 0;
      const hasUntrackedFiles = gitStatus.untrackedFiles.length > 0;
      const canStash = !hasNewFiles && !hasDeletedFiles && !hasUntrackedFiles;
      const { dirtyAction } = await promptDirtyState(gitStatus, canStash);
      if (dirtyAction === 'cancel') {
        logger.warn('Session save cancelled.');
        return;
      }
      if (dirtyAction === 'commit') {
        const { commitMessage } = await inquirer.customPrompt([
          {
            type: 'input',
            name: 'commitMessage',
            message: 'Enter commit message:',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Commit message is required';
              }
              return true;
            }
          }
        ]);
        const commitResult = await gitService.commitChanges(commitMessage);
        if (!commitResult.ok) {
          logger.error('Failed to commit changes', { error: commitResult.error });
          return;
        }
      } else if (dirtyAction === 'stash') {
        const stashResult = await gitService.createStash('Session save stash');
        if (!stashResult.ok) {
          logger.error('Failed to stash changes', { error: stashResult.error });
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
        stashId: null
      },
      saveSession,
      logger
    });
  } catch (error) {
    logger.error('Unexpected error during session save', { error });
  }
} 