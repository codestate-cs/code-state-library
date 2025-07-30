import { SaveSession, ConfigurableLogger, GitService } from '@codestate/cli-api/main';
import inquirer from '../../utils/inquirer';

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

      // Continue without Git integration
      logger.plainLog('Continuing without Git integration...');
      
      // Get user input for session details
      const sessionDetails = await inquirer.customPrompt([
        {
          type: 'input',
          name: 'sessionName',
          message: 'Enter session name:',
          validate: (input: string) => {
            if (!input.trim()) {
              return 'Session name is required';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'sessionNotes',
          message: 'Enter session notes (optional):'
        },
        {
          type: 'input',
          name: 'sessionTags',
          message: 'Enter session tags (comma-separated, optional):'
        }
      ]);

      // Get project root (current directory)
      const projectRoot = process.cwd();

      // Execute save session without Git
      const result = await saveSession.execute({
        name: sessionDetails.sessionName,
        projectRoot,
        notes: sessionDetails.sessionNotes || '',
        tags: sessionDetails.sessionTags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0),
        files: [], // Empty array for CLI
        git: {
          branch: 'no-git',
          commit: 'no-git',
          isDirty: false,
          stashId: null
        },
        extensions: {}
      });

      if (result.ok) {
        logger.log(`Session "${sessionDetails.sessionName}" saved successfully!`);
      } else {
        logger.error('Failed to save session', { error: result.error });
      }

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
      
      const choices = [
        { name: 'Commit changes', value: 'commit' }
      ];
      
      if (canStash) {
        choices.push({ name: 'Stash changes', value: 'stash' });
      }
      
      choices.push({ name: 'Cancel', value: 'cancel' });
      
      const { dirtyAction } = await inquirer.customPrompt([
        {
          type: 'list',
          name: 'dirtyAction',
          message: 'How would you like to handle these changes?',
          choices
        }
      ]);

      if (dirtyAction === 'cancel') {
        console.warn('Session save cancelled.');
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
    const currentBranchResult = await gitService.getCurrentBranch();
    const currentCommitResult = await gitService.getCurrentCommit();
    
    if (!currentBranchResult.ok || !currentCommitResult.ok) {
      logger.error('Failed to get Git state', { 
        branchError: currentBranchResult.ok ? undefined : currentBranchResult.error, 
        commitError: currentCommitResult.ok ? undefined : currentCommitResult.error 
      });
      return;
    }

    // 4. Get user input for session details
    const sessionDetails = await inquirer.customPrompt([
      {
        type: 'input',
        name: 'sessionName',
        message: 'Enter session name:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Session name is required';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'sessionNotes',
        message: 'Enter session notes (optional):'
      },
      {
        type: 'input',
        name: 'sessionTags',
        message: 'Enter session tags (comma-separated, optional):'
      }
    ]);

    // 5. Get project root (current directory for now)
    const projectRoot = process.cwd();

    // 6. Execute save session
    const result = await saveSession.execute({
      name: sessionDetails.sessionName,
      projectRoot,
      notes: sessionDetails.sessionNotes || '',
      tags: sessionDetails.sessionTags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0),
      files: [], // Empty array for CLI (IDE extension would populate this)
      git: {
        branch: currentBranchResult.value,
        commit: currentCommitResult.value,
        isDirty: false, // We've handled dirty state above
        stashId: null
      },
      extensions: {}
    });

    if (result.ok) {
      logger.log(`Session "${sessionDetails.sessionName}" saved successfully!`);
    } else {
      logger.error('Failed to save session');
    }

  } catch (error) {
    logger.error('Unexpected error during session save');
  }
} 