import { ConfigurableLogger } from "@codestate/core";
import {
  deleteSessionCommand,
  listSessionsCommand,
  resumeSessionCommand,
  saveSessionCommand,
  updateSessionCommand,
} from "../../commands/session";
import { exportSessionsTui } from "./exportSessionsTui";
import { importSessionsTui } from "./importSessionsTui";

function showSessionsHelp() {
  const logger = new ConfigurableLogger();
  logger.plainLog(`
Session Management Commands

Usage: codestate sessions <subcommand> [options]

Subcommands:
  save              Save current session (captures terminal commands)
  resume            Resume a saved session (restores terminal commands & file order)
  update            Update a saved session
  list              List all sessions with metadata
  delete            Delete a session
  export            Export sessions to JSON files (interactive selection)
  import            Import sessions from JSON files (interactive)

Examples:
  codestate sessions save
  codestate sessions save "Feature Work"
  codestate sessions resume
  codestate sessions resume "Feature Work"
  codestate sessions resume 123
  codestate sessions update "Feature Work"
  codestate sessions update 123
  codestate sessions list
  codestate sessions delete "Feature Work"
  codestate sessions delete 123
  codestate sessions export
  codestate sessions import

Features:
  • Terminal Command Capture: Sessions automatically capture running terminal commands
  • File Position Ordering: Files are opened in the correct sequence when resuming
  • Git Integration: Full Git state capture and restoration
`);
}

export async function handleSessionCommand(
  subcommand: string,
  options: string[]
) {
  const logger = new ConfigurableLogger();

  // Show help if no subcommand is provided
  if (!subcommand) {
    showSessionsHelp();
    return;
  }

  switch (subcommand) {
    case "save":
      await saveSessionCommand();
      break;
    case "resume":
      const sessionIdOrName = options[0];
      await resumeSessionCommand(sessionIdOrName);
      break;
    case "update":
      const updateSessionIdOrName = options[0];
      await updateSessionCommand(updateSessionIdOrName);
      break;
    case "list":
      await listSessionsCommand();
      break;
    case "delete":
      const deleteSessionIdOrName = options[0];
      await deleteSessionCommand(deleteSessionIdOrName);
      break;
    case "export":
      await exportSessionsTui();
      break;
    case "import":
      await importSessionsTui();
      break;
    default:
      logger.error(`Error: Unknown session subcommand '${subcommand}'`);
      logger.plainLog(
        "Available session commands: save, resume, update, list, delete, export, import"
      );
      process.exit(1);
  }
}
