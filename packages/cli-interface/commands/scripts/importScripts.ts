import { ImportScripts, ConfigurableLogger } from '@codestate/core/api';

export async function importScriptsCommand(json: string) {
  const logger = new ConfigurableLogger();
  const importScripts = new ImportScripts();
  const result = await importScripts.execute(json);
  if (result.ok) {
    logger.log('Scripts imported successfully');
  } else {
    logger.error('Failed to import scripts', { error: result.error });
  }
} 