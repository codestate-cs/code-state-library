import { ExecuteTerminalCollection, ConfigurableLogger, isSuccess, isFailure } from '@codestate/core';

export async function executeTerminalCollectionCommand(name: string) {
  const logger = new ConfigurableLogger();
  const executeTerminalCollection = new ExecuteTerminalCollection();
  
  // Get current working directory as default rootPath
  const currentRootPath = process.cwd();
  
  logger.plainLog(`🚀 Executing terminal collection: ${name}`);
  logger.plainLog(`📍 Path: ${currentRootPath}`);
  logger.plainLog('');
  
  const result = await executeTerminalCollection.execute(name, currentRootPath);
  
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
      logger.error('Failed to execute terminal collection', { error: result.error });
    }
    process.exit(1);
  }
  
  logger.log('Terminal collection executed successfully', { name, rootPath: currentRootPath });
}
