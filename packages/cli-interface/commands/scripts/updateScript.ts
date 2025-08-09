import { ConfigurableLogger, Script, UpdateScript } from "@codestate/core";

export async function updateScriptCommand(
  name: string,
  rootPath: string,
  scriptUpdate: Partial<Script>
) {
  const logger = new ConfigurableLogger();
  const updateScript = new UpdateScript();
  const result = await updateScript.execute(name, rootPath, scriptUpdate);
  if (result.ok) {
    const updatedFields = Object.keys(scriptUpdate).join(", ");
    logger.log(`Script '${name}' updated successfully (${updatedFields})`);
  } else {
    logger.error(`Failed to update script '${name}'`, { error: result.error });
  }
}
