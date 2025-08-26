import { ConfigurableLogger, DeleteTerminalCollection } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function deleteTerminalCollectionCommand(name: string, rootPath?: string) {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const deleteTerminalCollection = new DeleteTerminalCollection();
  
  const targetRootPath = rootPath || process.cwd();
  
  try {
    spinner.start("🗑️  Deleting terminal collection...");
    
    const result = await deleteTerminalCollection.execute(name, targetRootPath);
    
    if (result.ok) {
      spinner.succeed("Terminal collection deleted successfully");
      logger.log("Terminal collection deleted successfully");
    } else {
      spinner.fail("Failed to delete terminal collection");
      logger.error("Failed to delete terminal collection");
      process.exit(1);
    }
  } catch (error) {
    spinner.fail("An unexpected error occurred");
    logger.error("Unexpected error during deletion");
    process.exit(1);
  }
} 