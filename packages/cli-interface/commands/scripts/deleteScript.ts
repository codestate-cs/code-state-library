import { ConfigurableLogger, DeleteScript } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function deleteScriptCommand(scriptId: string) {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const deleteScript = new DeleteScript();
  
  spinner.start("🗑️  Deleting script...");
  
  const result = await deleteScript.execute(scriptId);
  
  if (result.ok) {
    spinner.succeed(`Script deleted successfully`);
    logger.log(`Script deleted successfully`);
  } else {
    spinner.fail(`Failed to delete script`);
    logger.error(`Failed to delete script`);
  }
}
