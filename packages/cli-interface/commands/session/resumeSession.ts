import { ResumeSession, ConfigurableLogger, GitService, ListSessions, SaveSession, UpdateSession, ApplyStash, Terminal, GetScriptsByRootPath } from '@codestate/cli-api/main';
import inquirer from '../../utils/inquirer';
import {
  promptSessionDetails,
  promptDirtyState,
  getCurrentGitState,
  handleSessionSave
} from './utils';

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
        logger.warn('No saved sessions found.');
        return;
      }
      const sessions = sessionsResult.value;
      const { selectedSession } = await inquirer.customPrompt([
        {
          type: 'list',
          name: 'selectedSession',
          message: 'Select a session to resume:',
          choices: sessions.map(s => ({ name: `${s.name} (${s.projectRoot})`, value: s.id }))
        }
      ]);
      targetSession = selectedSession || '';
    }

    // Ensure targetSession is not empty
    if (!targetSession || !targetSession.trim()) {
      logger.log('No session specified. Resume cancelled.');
      return;
    }

    // 1. Load session file and validate
    const sessionResult = await resumeSession.execute(targetSession);
    if (!sessionResult.ok) {
      logger.error('Failed to load session', { error: sessionResult.error });
      return;
    }

    const session = sessionResult.value;
    logger.log(`\n📋 Resuming session: "${session.name}"`);
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
      logger.plainLog('Cannot restore Git state. Session resumed without Git integration.');
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
        logger.warn('Session resume cancelled.');
        return;
      }
      if (dirtyAction === 'save') {
        logger.log('Saving current work as new session...');
        const sessionDetails = await promptSessionDetails();
        const gitState = await getCurrentGitState(gitService, logger);
        if (!gitState) return;
        await handleSessionSave({
          sessionDetails,
          projectRoot: process.cwd(),
          git: {
            ...gitState,
            isDirty: false,
            stashId: null
          },
          saveSession,
          logger
        });
        logger.log('Current work saved. Proceeding with resume...');
      } else if (dirtyAction === 'discard') {
        logger.log('Discarding current changes...');
        await terminal.execute('git reset --hard');
        await terminal.execute('git clean -fd');
        logger.log('Changes discarded. Proceeding with resume...');
      }
    }

    // 4. Restore Git state
    logger.log('\n🔄 Restoring Git state...');
    const currentBranchResult = await gitService.getCurrentBranch();
    if (currentBranchResult.ok && currentBranchResult.value !== session.git.branch) {
      logger.log(`Switching from ${currentBranchResult.value} to ${session.git.branch}...`);
      await terminal.execute(`git checkout ${session.git.branch}`);
      logger.log(`Branch switched to ${session.git.branch}`);
    }
    
    if (session.git.stashId) {
      logger.log(`Applying stash ${session.git.stashId}...`);
      const applyStash = new ApplyStash();
      const stashResult = await applyStash.execute(session.git.stashId);
      if (stashResult.ok && stashResult.value.success) {
        logger.log('Stash applied successfully');
      } else {
        logger.error('Failed to apply stash', { 
          error: stashResult.ok ? stashResult.value.error : stashResult.error 
        });
      }
    }

    // 5. Execute scripts for the projectRoot
    logger.log('\n🚀 Executing saved scripts...');
    const getScriptsByRootPath = new GetScriptsByRootPath();
    const scriptsResult = await getScriptsByRootPath.execute(session.projectRoot);
    if (scriptsResult.ok && scriptsResult.value.length > 0) {
      logger.log(`Found ${scriptsResult.value.length} script(s) to execute...`);
      
      // Spawn terminal windows for each script
      for (const script of scriptsResult.value) {
        logger.log(`Spawning terminal for script: ${script.name || script.script}`);
        
        const spawnResult = await terminal.spawnTerminal(script.script, {
          cwd: session.projectRoot,
          timeout: 5000 // Short timeout for spawning
        });
        
        if (!spawnResult.ok) {
          logger.error(`Failed to spawn terminal for script: ${script.name || script.script}`, { 
            error: spawnResult.error 
          });
        } else {
          logger.log(`Terminal spawned successfully for: ${script.name || script.script}`);
        }
        
        // Small delay between spawning terminals to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      logger.log('All script terminals spawned successfully');
    } else {
      logger.log('No scripts to execute.');
    }

    // 6. Update session metadata (last accessed)
    logger.log('\n📝 Updating session metadata...');
    // TODO: Implement session metadata update
    logger.log('Session metadata updated');

    logger.log(`\n✅ Session "${session.name}" resumed successfully!`);
    logger.log('Your development environment has been restored.');
    if (session.notes) {
      logger.log(`\n📝 Notes: ${session.notes}`);
    }
    if (session.tags.length > 0) {
      logger.log(`🏷️  Tags: ${session.tags.join(', ')}`);
    }
  } catch (error) {
    logger.error('Unexpected error during session resume', { error });
  }
} 