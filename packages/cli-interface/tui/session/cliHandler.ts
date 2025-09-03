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

Filter Options:
  --root-path <path>     Filter by project root path (use '.' for current directory)
  --tags <tags>          Filter by tags (comma-separated)
  --search <term>        Search in session names and notes
  --showAll              Show full session data including terminal collections and scripts

Examples:
  codestate sessions save
  codestate sessions save "Feature Work"
  codestate sessions resume
  codestate sessions resume "Feature Work"
  codestate sessions resume 123
  codestate sessions update "Feature Work"
  codestate sessions update 123
  codestate sessions list
  codestate sessions list --showAll
  codestate sessions list --root-path .
  codestate sessions list --root-path /path/to/project
  codestate sessions list --tags "feature,development"
  codestate sessions list --search "auth"
  codestate sessions list --showAll --tags "feature"
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
      await handleListCommand(options);
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

async function handleListCommand(options: string[]) {
  const logger = new ConfigurableLogger();
  
  // Parse options
  let rootPath: string | undefined;
  let useCurrentPath = false;
  let tagsFilter: string[] | undefined;
  let searchTerm: string | undefined;
  let showAll = false;
  
  // Parse the options array
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    
    if (option === "--root-path") {
      // Check if next option is a path or if we should use current directory
      if (i + 1 < options.length && !options[i + 1].startsWith("--")) {
        // Next option is a path
        rootPath = options[i + 1];
        i++; // Skip the next option since we consumed it
      } else {
        // No path specified, use current directory
        useCurrentPath = true;
        rootPath = process.cwd();
      }
    } else if (option === "--tags") {
      // Check if next option is tags
      if (i + 1 < options.length && !options[i + 1].startsWith("--")) {
        // Next option contains tags
        const tagsValues = options[i + 1];
        // Split by comma and trim spaces, filter out empty values
        tagsFilter = tagsValues
          .split(',')
          .map(value => value.trim())
          .filter(value => value.length > 0);
        i++; // Skip the next option since we consumed it
      } else {
        logger.error("Error: --tags requires values (e.g., --tags 'feature, development')");
        process.exit(1);
      }
    } else if (option === "--search") {
      // Check if next option is search term
      if (i + 1 < options.length && !options[i + 1].startsWith("--")) {
        // Next option is search term
        searchTerm = options[i + 1];
        i++; // Skip the next option since we consumed it
      } else {
        logger.error("Error: --search requires a search term");
        process.exit(1);
      }
    } else if (option === "--showAll") {
      showAll = true;
    }
  }
  
  // Build filter object
  const filter: any = {};
  if (tagsFilter) filter.tags = tagsFilter;
  if (searchTerm) filter.search = searchTerm;
  if (showAll) filter.loadAll = showAll;
  
  // Call listSessionsCommand with filter
  await listSessionsCommand(showAll, filter);
}
