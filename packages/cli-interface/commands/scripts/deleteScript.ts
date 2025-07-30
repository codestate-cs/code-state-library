import { DeleteScript, ConfigurableLogger } from '@codestate/cli-api/main';

export async function deleteScriptCommand(name: string, rootPath: string) {
  const logger = new ConfigurableLogger();
  const deleteScript = new DeleteScript();
  const result = await deleteScript.execute(name, rootPath);
  if (result.ok) {
    logger.log(`Script '${name}' deleted successfully`);
  } else {
    logger.error(`Failed to delete script '${name}'`, { error: result.error });
  }
} 