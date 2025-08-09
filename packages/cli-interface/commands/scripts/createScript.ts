import { ConfigurableLogger, CreateScripts, Script } from "@codestate/core";

export async function createScriptCommand(scripts: Script | Script[]) {
  const logger = new ConfigurableLogger();
  const createScripts = new CreateScripts();

  const scriptsArray = Array.isArray(scripts) ? scripts : [scripts];
  const result = await createScripts.execute(scriptsArray);

  if (result.ok) {
    const scriptNames = scriptsArray.map((s) => s.name).join(", ");
    if (scriptsArray.length === 1) {
      logger.log(`Script '${scriptNames}' created successfully`);
    } else {
      logger.log(`Scripts created successfully: ${scriptNames}`);
    }
  } else {
    logger.error("Failed to create scripts", {
      error: result.error,
      count: scriptsArray.length,
    });
  }
}
