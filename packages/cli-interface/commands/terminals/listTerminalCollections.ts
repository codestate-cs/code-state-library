import { ListTerminalCollections, ConfigurableLogger, isSuccess, isFailure } from '@codestate/core';

export async function listTerminalCollectionsCommand() {
  const logger = new ConfigurableLogger();
  const listTerminalCollections = new ListTerminalCollections();
  
  const result = await listTerminalCollections.execute();
  
  if (isFailure(result)) {
    logger.error('Failed to list terminal collections', { error: result.error });
    process.exit(1);
  }
  
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
