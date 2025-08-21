import { GetTerminalCollection, ConfigurableLogger, isSuccess, isFailure } from '@codestate/core';

export async function getTerminalCollectionCommand(name: string) {
  const logger = new ConfigurableLogger();
  const getTerminalCollection = new GetTerminalCollection();
  
  // Get current working directory as default rootPath
  const currentRootPath = process.cwd();
  
  const result = await getTerminalCollection.execute(name, currentRootPath);
  
  if (isFailure(result)) {
    // Check if it's a "not found" error and provide a user-friendly message
    if ('code' in result.error && result.error.code === 'STORAGE_READ_FAILED') {
      logger.plainLog(`❌ Terminal collection '${name}' not found in the current directory.`);
      logger.plainLog('');
      logger.plainLog(`Current directory: ${currentRootPath}`);
      logger.plainLog('');
      logger.plainLog('💡 Try these options:');
      logger.plainLog('   • Use `codestate terminals list` to see available terminal collections');
      logger.plainLog('   • Make sure you\'re in the correct project directory');
      logger.plainLog('   • Create a new terminal collection with `codestate terminals create`');
    } else {
      logger.error('Failed to get terminal collection', { error: result.error });
    }
    process.exit(1);
  }
  
  const terminalCollection = result.value;
  
  logger.plainLog(`📁 Terminal Collection: ${terminalCollection.name}`);
  logger.plainLog(`📍 Path: ${terminalCollection.rootPath}`);
  logger.plainLog(`🔄 Lifecycle: ${terminalCollection.lifecycle.join(', ')}`);
  logger.plainLog(`📜 Scripts: ${terminalCollection.scripts.length}`);
  logger.plainLog('');
  
  for (const script of terminalCollection.scripts) {
    logger.plainLog(`📜 ${script.name}`);
    if (script.lifecycle && script.lifecycle.length > 0) {
      logger.plainLog(`   Lifecycle: ${script.lifecycle.join(', ')}`);
    }
    
    if (script.commands && script.commands.length > 0) {
      logger.plainLog(`   Commands:`);
      const sortedCommands = script.commands.sort((a: any, b: any) => a.priority - b.priority);
      for (const command of sortedCommands) {
        logger.plainLog(`   ${command.priority}. ${command.name}: ${command.command}`);
      }
    } else if (script.script) {
      logger.plainLog(`   Script: ${script.script}`);
    }
    logger.plainLog('');
  }
}
