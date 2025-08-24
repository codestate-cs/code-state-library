import { ConfigurableLogger } from "@codestate/core";
import { handleConfigCommand } from "../tui/config";
import { handleScriptCommand } from "../tui/scripts";
import { handleSessionCommand } from "../tui/session";
import { handleTerminalCommand } from "../tui/terminals";
import { handleResetCommand } from "../tui/reset";

export async function handleCommand(
  command: string,
  subcommand: string,
  options: string[]
) {
  const logger = new ConfigurableLogger();

  switch (command) {
    case "config":
      await handleConfigCommand(subcommand, options);
      break;
    case "scripts":
      await handleScriptCommand(subcommand, options);
      break;
    case "session":
      await handleSessionCommand(subcommand, options);
      break;
    case "terminals":
      await handleTerminalCommand(subcommand, options);
      break;
    case "reset":
      await handleResetCommand(subcommand, options);
      break;
    default:
      logger.error(`Error: Unknown command '${command}'`);
      logger.plainLog("Available commands: config, scripts, session, terminals, reset");
      process.exit(1);
  }
}
