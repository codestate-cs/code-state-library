import { UpdateConfig, ConfigurableLogger, Config } from '@codestate/cli-api/main';

export async function updateConfigCommand(partial: Partial<Config>) {
  const logger = new ConfigurableLogger();
  const updateConfig = new UpdateConfig();
  const result = await updateConfig.execute(partial);
  if (result.ok) {
    const config = result.value;
    console.log('\n✅ Configuration updated successfully!');
    console.log('\n📋 Current Configuration:');
    console.log('─────────────────────────');
    console.log(`Editor: ${config.ide}`);
    console.log(`Version: ${config.version}`);
    console.log(`Encryption: ${config.encryption.enabled ? 'Yes' : 'No'}`);
    console.log(`Storage Path: ${config.storagePath}`);
    console.log(`Log Level: ${config.logger.level}`);
    console.log(`Log Sinks: ${config.logger.sinks.join(', ')}`);
    
    if (config.experimental && Object.keys(config.experimental).length > 0) {
      console.log('\n🔬 Experimental Features:');
      Object.entries(config.experimental).forEach(([key, value]) => {
        console.log(`  ${key}: ${value ? '✅' : '❌'}`);
      });
    }
    
    if (config.extensions && Object.keys(config.extensions).length > 0) {
      console.log('\n🔌 Extensions:');
      Object.keys(config.extensions).forEach(key => {
        console.log(`  ${key}`);
      });
    }
    console.log('');
  } else {
    logger.error('Failed to update config', { error: result.error });
  }
} 