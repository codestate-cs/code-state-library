import { TerminalCollectionFacade, ConfigurableLogger, isSuccess, isFailure } from '@codestate/core';
import { CLISpinner } from '../../utils/CLISpinner';

export async function listTerminalCollectionsCommand(
  rootPath?: string, 
  lifecycleFilter?: string[]
) {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const terminalCollectionService = new TerminalCollectionFacade();
  
  spinner.start("📋 Loading terminal collections...");
  
  // Build filtering options
  const options: { rootPath?: string; lifecycle?: string; loadScripts?: boolean } = {
    loadScripts: true
  };
  
  if (rootPath) {
    options.rootPath = rootPath;
  }
  
  if (lifecycleFilter && lifecycleFilter.length > 0) {
    options.lifecycle = lifecycleFilter[0]; // Use first filter for now
  }

  options.loadScripts = true;
  
  const result = await terminalCollectionService.getTerminalCollections(options);
  
  if (isFailure(result)) {
    spinner.fail("Failed to load terminal collections");
    logger.error('Failed to list terminal collections');
    process.exit(1);
  }
  
  spinner.succeed("Terminal collections loaded");
  
  const terminalCollections = result.value;
  
  if (terminalCollections.length === 0) {
    logger.plainLog('📝 No terminal collections found.');
    
    // Show applied filters if any
    if (rootPath || lifecycleFilter) {
      logger.plainLog('Applied filters:');
      if (rootPath) logger.plainLog(`   Root path: ${rootPath}`);
      if (lifecycleFilter) logger.plainLog(`   Lifecycle: ${lifecycleFilter.join(', ')}`);
      logger.plainLog('');
    }
    
    logger.plainLog('💡 To get started:');
    logger.plainLog('   • Create your first terminal collection with `codestate terminals create`');
    logger.plainLog('   • Terminal collections help you manage multiple scripts that run together');
    logger.plainLog('   • Each script in a terminal collection opens in a new terminal tab');
    logger.plainLog('');
    return;
  }
  
  logger.plainLog('Terminal Collections:');
  
  // Show applied filters if any
  if (rootPath || lifecycleFilter) {
    logger.plainLog('Applied filters:');
    if (rootPath) logger.plainLog(`   Root path: ${rootPath}`);
    if (lifecycleFilter) logger.plainLog(`   Lifecycle: ${lifecycleFilter.join(', ')}`);
    logger.plainLog('');
  }
  
  for (const terminalCollection of terminalCollections) {
    logger.plainLog(`📁 ${terminalCollection.name} (${terminalCollection.rootPath})`);
    logger.plainLog(`   Lifecycle: ${terminalCollection.lifecycle.join(', ')}`);
    logger.plainLog(`   Scripts: ${terminalCollection.scripts.length}`);
    
    for (const script of terminalCollection.scripts) {
      logger.plainLog(`   └── ${script.name}`);
      if (script.lifecycle && script.lifecycle.length > 0) {
        logger.plainLog(`       Lifecycle: ${script.lifecycle.join(', ')}`);
      }
      if (script.commands && script.commands.length > 0) {
        logger.plainLog(`       Commands: ${script.commands.length}`);
      }
    }
    logger.plainLog('');
  }
}
