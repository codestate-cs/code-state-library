import { ResetConfig, ConfigurableLogger } from '@codestate/cli-api/main';

export async function resetConfigCommand() {
  const logger = new ConfigurableLogger();
  const resetConfig = new ResetConfig();
  const result = await resetConfig.execute();
  if (result.ok) {
    logger.log('Config reset to defaults:', { config: result.value });
  } else {
    logger.error('Failed to reset config', { error: result.error });
  }
} 