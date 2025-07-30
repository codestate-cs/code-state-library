import { UpdateSession, ConfigurableLogger, GitService } from '@codestate/cli-api/main';
import { TerminalFacade } from '@codestate/infrastructure/services/Terminal/TerminalFacade';
import inquirer from '../../utils/inquirer';
import {
  promptSessionDetails,
  promptDirtyState,
  getCurrentGitState,
  handleSessionSave
} from './utils';

export async function updateSessionCommand(sessionIdOrName?: string) {
  const logger = new ConfigurableLogger();
  const updateSession = new UpdateSession();
  const gitService = new GitService();
  const terminal = new TerminalFacade();

  try {
    // If no session specified, ask user to select one
    let targetSession = sessionIdOrName;
    if (!targetSession) {
      const { UpdateSession } = await import('@codestate/cli-api/main');
      const listSessions = new (await import('@codestate/core/use-cases/session/ListSessions')).ListSessions();
      const sessionsResult = await listSessions.execute();
      
      if (!sessionsResult.ok || sessionsResult.value.length === 0) {
        logger.warn('No saved sessions found.');
        return;
      }
      
      const sessions = sessionsResult.value;
      const { selectedSession } = await inquirer.customPrompt([
        {
          type: 'list',
          name: 'selectedSession',
          message: 'Select a session to update:',
          choices: sessions.map(s => ({ name: `${s.name} (${s.projectRoot})`, value: s.id }))
        }
      ]);
      targetSession = selectedSession || '';
    }

    // Ensure targetSession is not empty
    if (!targetSession || !targetSession.trim()) {
      logger.log('No session specified. Update cancelled.');
      return;
    }

    // 1. Load existing session and validate
    logger.log(`\n📋 Updating session: "${targetSession}"`);
    
    const sessionResult = await updateSession.execute(targetSession, {});
    if (!sessionResult.ok) {
      logger.error('Failed to load session', { error: sessionResult.error });
      return;
    }

    const session = sessionResult.value;
    logger.log(`Session: "${session.name}"`);
    logger.log(`Project: ${session.projectRoot}`);
    logger.log(`Branch: ${session.git.branch}`);
    logger.log(`Commit: ${session.git.commit}`);

    // Check if we're in the correct directory
    const currentDir = process.cwd();
    if (currentDir !== session.projectRoot) {
      logger.warn(`You are in ${currentDir}`);
      logger.log(`Session was saved from ${session.projectRoot}`);
      const { changeDirectory } = await inquirer.customPrompt([
        {
          type: 'confirm',
          name: 'changeDirectory',
          message: 'Do you want to change to the session directory?',
          default: true
        }
      ]);
      if (changeDirectory) {
        logger.log(`Changing to ${session.projectRoot}...`);
        process.chdir(session.projectRoot);
      } else {
        logger.log('Continuing in current directory...');
      }
    }

    // 2. Check current Git status
    const isRepoResult = await gitService.isGitRepository();
    if (!isRepoResult.ok || !isRepoResult.value) {
      logger.warn('Current directory is not a Git repository.');
      logger.plainLog('Cannot update Git state. Session update cancelled.');
      return;
    }

    const gitStatusResult = await gitService.getStatus();
    if (!gitStatusResult.ok) {
      logger.error('Failed to get Git status', { error: gitStatusResult.error });
      return;
    }
    const gitStatus = gitStatusResult.value;

    // 3. Handle current repository dirty state
    if (gitStatus.isDirty) {
      logger.warn('Current repository has uncommitted changes:');
      gitStatus.dirtyFiles.forEach(file => {
        logger.plainLog(`  ${file.status}: ${file.path}`);
      });
      
      // Check if we can stash (only modified files, no new/deleted files)
      const hasNewFiles = gitStatus.newFiles.length > 0;
      const hasDeletedFiles = gitStatus.deletedFiles.length > 0;
      const hasUntrackedFiles = gitStatus.untrackedFiles.length > 0;
      const canStash = !hasNewFiles && !hasDeletedFiles && !hasUntrackedFiles;
      
      const { dirtyAction } = await promptDirtyState(gitStatus, canStash);
      if (dirtyAction === 'cancel') {
        logger.warn('Session update cancelled.');
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
        
        logger.log('Committing changes...');
        const commitResult = await gitService.commitChanges(commitMessage);
        if (!commitResult.ok) {
          logger.error('Failed to commit changes', { error: commitResult.error });
          logger.warn('Session update cancelled.');
          return;
        }
        logger.log('Changes committed successfully');
      } else if (dirtyAction === 'stash') {
        logger.log('Stashing changes...');
        const stashResult = await gitService.createStash('Session update stash');
        if (!stashResult.ok || !stashResult.value.success) {
          logger.error('Failed to stash changes', { error: stashResult.error });
          logger.warn('Session update cancelled.');
          return;
        }
        logger.log('Changes stashed successfully');
      }
    }

    // 4. Capture current Git state
    logger.log('\n📸 Capturing current Git state...');
    const gitState = await getCurrentGitState(gitService, logger);
    if (!gitState) {
      logger.error('Failed to capture Git state');
      return;
    }

    // 5. Ask user for new notes and tags (pre-populate with existing values)
    logger.log('\n📝 Updating session details...');
    const sessionDetails = await promptSessionDetails({
      name: session.name, // Session name is immutable
      notes: session.notes || '',
      tags: session.tags.join(', ') // Convert array to string for prompt
    });

    // 6. Update session with new data (keep same ID and name)
    logger.log('\n💾 Updating session...');
    const updateResult = await updateSession.execute(targetSession, {
      notes: sessionDetails.sessionNotes,
      tags: sessionDetails.sessionTags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0),
      git: gitState,
      files: [], // Empty array in CLI mode
      extensions: {}
    });

    if (!updateResult.ok) {
      logger.error('Failed to update session', { error: updateResult.error });
      return;
    }

    const updatedSession = updateResult.value;
    logger.log(`\n✅ Session "${updatedSession.name}" updated successfully!`);
    logger.log(`Updated at: ${updatedSession.updatedAt.toISOString()}`);
    
    if (updatedSession.notes) {
      logger.log(`📝 Notes: ${updatedSession.notes}`);
    }
    if (updatedSession.tags.length > 0) {
      logger.log(`🏷️  Tags: ${updatedSession.tags.join(', ')}`);
    }
    
    logger.log(`Branch: ${updatedSession.git.branch}`);
    logger.log(`Commit: ${updatedSession.git.commit}`);
    logger.log(`Dirty: ${updatedSession.git.isDirty ? 'Yes' : 'No'}`);
    if (updatedSession.git.stashId) {
      logger.log(`Stash: ${updatedSession.git.stashId}`);
    }

  } catch (error) {
    logger.error('Unexpected error during session update', { error });
  }
} 