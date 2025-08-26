import { ListTerminalCollections, ConfigurableLogger, isSuccess, isFailure } from '@codestate/core';
import { CLISpinner } from '../../utils/CLISpinner';

export async function listTerminalCollectionsCommand() {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const listTerminalCollections = new ListTerminalCollections();
  
  spinner.start("📋 Loading terminal collections...");
  
  const result = await listTerminalCollections.execute();
  
  if (isFailure(result)) {
    spinner.fail("Failed to load terminal collections");
    logger.error('Failed to list terminal collections');
    process.exit(1);
  }
  
  spinner.succeed("Terminal collections loaded");
  
  const terminalCollections = result.value;
  
  if (terminalCollections.length === 0) {
    logger.plainLog('📝 No terminal collections found.');
    logger.plainLog('');
    logger.plainLog('💡 To get started:');
    logger.plainLog('   • Create your first terminal collection with `codestate terminals create`');
    logger.plainLog('   • Terminal collections help you manage multiple scripts that run together');
    logger.plainLog('   • Each script in a terminal collection opens in a new terminal tab');
    logger.plainLog('');
    return;
  }
  
  logger.plainLog('Terminal Collections:');
  logger.plainLog('');
  
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
