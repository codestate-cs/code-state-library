import { ConfigurableLogger, GetConfig } from "@codestate/core";

export async function showConfigCommand() {
  const logger = new ConfigurableLogger();
  const getConfig = new GetConfig();
  const result = await getConfig.execute();
  if (result.ok) {
    const config = result.value;
    logger.plainLog("\n📋 Current Configuration:");
    logger.plainLog("─────────────────────────");
    logger.plainLog(`Editor: ${config.ide}`);
    logger.plainLog(`Version: ${config.version}`);
    logger.plainLog(`Encryption: ${config.encryption.enabled ? "Yes" : "No"}`);
    logger.plainLog(`Storage Path: ${config.storagePath}`);
    logger.plainLog(`Log Level: ${config.logger.level}`);
    logger.plainLog(`Log Sinks: ${config.logger.sinks.join(", ")}`);

    if (config.experimental && Object.keys(config.experimental).length > 0) {
      logger.plainLog("\n🔬 Experimental Features:");
      Object.entries(config.experimental).forEach(([key, value]) => {
        logger.plainLog(`  ${key}: ${value ? "✅" : "❌"}`);
      });
    }

    if (config.extensions && Object.keys(config.extensions).length > 0) {
      logger.plainLog("\n🔌 Extensions:");
      Object.keys(config.extensions).forEach((key) => {
        logger.plainLog(`  ${key}`);
      });
    }
    logger.plainLog("");
  } else {
    logger.error("Failed to load config", { error: result.error });
  }
}
