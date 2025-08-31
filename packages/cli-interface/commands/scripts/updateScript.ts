import { ConfigurableLogger, Script, UpdateScript, Result } from "@codestate/core";

export async function updateScriptCommand(
  id: string,
  scriptUpdate: Partial<Script>
): Promise<Result<void>> {
  const logger = new ConfigurableLogger();
  const updateScript = new UpdateScript();
  const result = await updateScript.execute(id, scriptUpdate);
  
  if (result.ok) {
    const updatedFields = Object.keys(scriptUpdate).join(", ");
    logger.log(`Script updated successfully (${updatedFields})`);
  } else {
    logger.error("Failed to update script");
  }
  
  return result;
}
