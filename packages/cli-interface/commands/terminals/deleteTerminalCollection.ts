import { ConfigurableLogger, TerminalCollectionFacade } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function deleteTerminalCollectionCommand(ids: string[]) {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const terminalCollectionService = new TerminalCollectionFacade();
  
  try {
    spinner.start("🗑️  Deleting terminal collection(s)...");
    
    const result = await terminalCollectionService.deleteTerminalCollections(ids);
    
    if (result.ok) {
      spinner.succeed(`Terminal collection${ids.length > 1 ? 's' : ''} deleted successfully`);
      logger.log(`Terminal collection${ids.length > 1 ? 's' : ''} deleted successfully`);
    } else {
      spinner.fail("Failed to delete terminal collection(s)");
      logger.error("Failed to delete terminal collection(s)");
      process.exit(1);
    }
  } catch (error) {
    spinner.fail("An unexpected error occurred");
    logger.error("Unexpected error during deletion");
    process.exit(1);
  }
} 