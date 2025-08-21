import { ConfigurableLogger } from "@codestate/core";
import { listTerminalCollectionsCommand } from "../../commands/terminals/listTerminalCollections";
import { getTerminalCollectionCommand } from "../../commands/terminals/getTerminalCollection";
import { executeTerminalCollectionCommand } from "../../commands/terminals/executeTerminalCollection";
import { createTerminalCollectionTui } from "./createTerminalCollectionTui";

export async function handleTerminalCommand(subcommand: string, options: string[]) {
  const logger = new ConfigurableLogger();

  switch (subcommand) {
    case "list":
      await listTerminalCollectionsCommand();
      break;
    case "create":
      await createTerminalCollectionTui();
      break;
    case "show":
      if (options.length < 1) {
        logger.error("Error: Terminal name is required");
        logger.plainLog("Usage: codestate terminals show <terminal-name>");
        process.exit(1);
      }
      await getTerminalCollectionCommand(options[0]);
      break;
    case "resume":
      if (options.length < 1) {
        logger.error("Error: Terminal name is required");
        logger.plainLog("Usage: codestate terminals resume <terminal-name>");
        process.exit(1);
      }
      await executeTerminalCollectionCommand(options[0]);
      break;
    default:
      logger.error(`Error: Unknown terminals subcommand '${subcommand}'`);
      logger.plainLog("Available subcommands: list, create, show, resume");
      logger.plainLog("Usage:");
      logger.plainLog("  codestate terminals list");
      logger.plainLog("  codestate terminals create");
      logger.plainLog("  codestate terminals show <terminal-name>");
      logger.plainLog("  codestate terminals resume <terminal-name>");
      process.exit(1);
  }
}
