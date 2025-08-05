import { GetScriptsByRootPath, ConfigurableLogger } from '@codestate/core/api';

export async function showScriptsByRootPathCommand(rootPath: string) {
  const logger = new ConfigurableLogger();
  const getScriptsByRootPath = new GetScriptsByRootPath();
  const result = await getScriptsByRootPath.execute(rootPath);
  if (result.ok) {
    logger.log(`Scripts for ${rootPath}:`, { scripts: result.value });
  } else {
    logger.error('Failed to load scripts for root path', { error: result.error, rootPath });
  }
} 