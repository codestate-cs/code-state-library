import { ConfigurableLogger, ExportScripts } from "@codestate/core";

export async function exportScriptsCommand() {
  const logger = new ConfigurableLogger();
  const exportScripts = new ExportScripts();
  const result = await exportScripts.execute();
  if (result.ok) {
    logger.log("Scripts exported successfully");
  } else {
    logger.error("Failed to export scripts");
  }
}
