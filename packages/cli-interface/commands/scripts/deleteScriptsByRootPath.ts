import { DeleteScriptsByRootPath, ConfigurableLogger } from '@codestate/core/api';

export async function deleteScriptsByRootPathCommand(rootPath: string) {
  const logger = new ConfigurableLogger();
  const deleteScriptsByRootPath = new DeleteScriptsByRootPath();
  const result = await deleteScriptsByRootPath.execute(rootPath);
  if (result.ok) {
    logger.log('Scripts deleted for root path successfully', { rootPath });
  } else {
    logger.error('Failed to delete scripts for root path', { error: result.error, rootPath });
  }
} 