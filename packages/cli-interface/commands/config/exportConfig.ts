import { ConfigurableLogger, ExportConfig } from "@codestate/core";

export async function exportConfigCommand() {
  const logger = new ConfigurableLogger();
  const exportConfig = new ExportConfig();
  const result = await exportConfig.execute();
  if (result.ok) {
    logger.log("Exported config");
  } else {
    logger.error("Failed to export config");
  }
}
