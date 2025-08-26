import { ConfigurableLogger, ImportConfig } from "@codestate/core";

export async function importConfigCommand(json: string) {
  const logger = new ConfigurableLogger();
  const importConfig = new ImportConfig();
  const result = await importConfig.execute(json);
  if (result.ok) {
    logger.log("Config imported");
  } else {
    logger.error("Failed to import config");
  }
}
