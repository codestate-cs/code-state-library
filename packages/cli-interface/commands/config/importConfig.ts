import { ImportConfig, ConfigurableLogger } from '@codestate/core/api';

export async function importConfigCommand(json: string) {
  const logger = new ConfigurableLogger();
  const importConfig = new ImportConfig();
  const result = await importConfig.execute(json);
  if (result.ok) {
    logger.log('Config imported:', { config: result.value });
  } else {
    logger.error('Failed to import config', { error: result.error });
  }
} 