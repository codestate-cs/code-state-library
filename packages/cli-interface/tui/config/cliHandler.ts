import { ConfigurableLogger } from "@codestate/core";
import { exportConfigTui } from "./exportConfigTui";
import { importConfigTui } from "./importConfigTui";
import { resetConfigTui } from "./resetConfigTui";
import { showConfigTui } from "./showConfigTui";
import { updateConfigTui } from "./updateConfigTui";

function showConfigHelp() {
  const logger = new ConfigurableLogger();
  logger.plainLog(`
Configuration Management Commands

Usage: codestate config <subcommand> [options]

Subcommands:
  show              Show current configuration
  edit              Edit configuration interactively
  reset             Reset configuration to defaults
  export            Export configuration to file
  import            Import configuration from file

Examples:
  codestate config show
  codestate config edit
  codestate config reset
  codestate config export
  codestate config import --file <path>

Options:
  --file <path>    File path for import/export operations
`);
}

export async function handleConfigCommand(
  subcommand: string,
  options: string[]
) {
  const logger = new ConfigurableLogger();

  // Show help if no subcommand is provided
  if (!subcommand) {
    showConfigHelp();
    return;
  }

  switch (subcommand) {
    case "show":
      await showConfigTui();
      break;
    case "edit":
      // Use the TUI version for interactive editing
      await updateConfigTui();
      break;
    case "reset":
      await resetConfigTui();
      break;
    case "export":
      await exportConfigTui();
      break;
    case "import":
      // Check if file path is provided
      const fileIndex = options.indexOf("--file");
      if (fileIndex === -1 || fileIndex === options.length - 1) {
        logger.error("Error: --file option is required for import command");
        logger.plainLog("Usage: codestate config import --file <path>");
        process.exit(1);
      }
      const filePath = options[fileIndex + 1];
      // Use the TUI version for file handling
      await importConfigTui();
      break;
    default:
      logger.error(`Error: Unknown config subcommand '${subcommand}'`);
      logger.plainLog(
        "Available config subcommands: show, edit, reset, export, import"
      );
      process.exit(1);
  }
}
