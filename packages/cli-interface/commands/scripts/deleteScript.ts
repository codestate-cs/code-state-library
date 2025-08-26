import { ConfigurableLogger, DeleteScript } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function deleteScriptCommand(name: string, rootPath: string) {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const deleteScript = new DeleteScript();
  
  spinner.start("🗑️  Deleting script...");
  
  const result = await deleteScript.execute(name, rootPath);
  
  if (result.ok) {
    spinner.succeed(`Script '${name}' deleted successfully`);
    logger.log(`Script '${name}' deleted successfully`);
  } else {
    spinner.fail(`Failed to delete script '${name}'`);
    logger.error(`Failed to delete script '${name}'`);
  }
}
