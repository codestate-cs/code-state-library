import { ConfigurableLogger, CreateScripts, Script } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function createScriptCommand(scripts: Script | Script[]) {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const createScripts = new CreateScripts();

  const scriptsArray = Array.isArray(scripts) ? scripts : [scripts];
  
  if (scriptsArray.length === 1) {
    spinner.start("📜 Creating script...");
  } else {
    spinner.start(`📜 Creating ${scriptsArray.length} scripts...`);
  }
  
  const result = await createScripts.execute(scriptsArray);

  if (result.ok) {
    const scriptNames = scriptsArray.map((s) => s.name).join(", ");
    if (scriptsArray.length === 1) {
      spinner.succeed(`Script '${scriptNames}' created successfully`);
      logger.log(`Script '${scriptNames}' created successfully`);
    } else {
      spinner.succeed(`Scripts created successfully: ${scriptNames}`);
      logger.log(`Scripts created successfully: ${scriptNames}`);
    }
  } else {
    spinner.fail("Failed to create scripts");
    logger.error("Failed to create scripts");
  }
}
