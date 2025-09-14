import { ConfigurableLogger } from "@codestate/core";
import { listTerminalCollectionsCommand } from "../../commands/terminals/listTerminalCollections";
import { getTerminalCollectionCommand } from "../../commands/terminals/getTerminalCollection";
import { executeTerminalCollectionCommand } from "../../commands/terminals/executeTerminalCollection";
import { createTerminalCollectionTui } from "./createTerminalCollectionTui";
import { deleteTerminalCollectionTui } from "./deleteTerminalCollectionTui";
import { updateTerminalCollectionTui } from "./updateTerminalCollectionTui";
import { deleteTerminalCollectionCommand } from "../../commands/terminals/deleteTerminalCollection";
import { updateTerminalCollectionCommand } from "../../commands/terminals/updateTerminalCollection";
import { exportTerminalCollectionsTui } from "./exportTerminalCollectionsTui";
import { importTerminalCollectionsTui } from "./importTerminalCollectionsTui";

function showTerminalsHelp() {
  const logger = new ConfigurableLogger();
  logger.plainLog(`
Terminal Collection Management Commands

Usage: codestate terminals <subcommand> [options]

Subcommands:
  list            List all terminal collections (supports filtering)
  create          Create a new terminal collection interactively
  show            Show all terminal collections (supports filtering)
  resume          Execute a terminal collection (supports filtering)
  update          Update terminal collections interactively
  delete          Delete terminal collections interactively
  export          Export terminal collections to JSON files (interactive selection)
  import          Import terminal collections from JSON files (interactive)

Filter Options:
  --root-path <path>     Filter by root path (use '.' for current directory)
  --lifecycle <events>   Filter by lifecycle events (open, resume, none)
  --lifecycle open,resume,none  Multiple events separated by commas

Examples:
  codestate terminals list
  codestate terminals list --root-path .
  codestate terminals list --lifecycle open,resume
  codestate terminals create
  codestate terminals show
  codestate terminals show --root-path /path/to/project
  codestate terminals show --lifecycle open
  codestate terminals resume
  codestate terminals resume my-collection
  codestate terminals resume --root-path /path/to/project
  codestate terminals resume my-collection --lifecycle open
  codestate terminals update
  codestate terminals update my-collection
  codestate terminals delete
  codestate terminals delete 123
  codestate terminals export
  codestate terminals import

Lifecycle Events:
  open     - Terminal collections with open lifecycle events
  resume   - Terminal collections with resume lifecycle events
  none     - Terminal collections with no lifecycle events
`);
}

export async function handleTerminalCommand(subcommand: string, options: string[]) {
  const logger = new ConfigurableLogger();

  // Show help if no subcommand is provided
  if (!subcommand) {
    showTerminalsHelp();
    return;
  }

  switch (subcommand) {
    case "list":
      await handleListCommand(options);
      break;
    case "create":
      await createTerminalCollectionTui();
      break;
    case "show":
      await handleShowCommand(options);
      break;
    case "resume":
      await handleResumeCommand(options);
      break;
    case "update":
      if (options.length === 0) {
        // Interactive mode - show TUI
        await updateTerminalCollectionTui();
      } else if (options.length === 1) {
        // Non-interactive mode - update by name
        await updateTerminalCollectionCommand(options[0]);
      } else {
        logger.error("Error: Too many arguments for update command");
        logger.plainLog("Usage: codestate terminals update [terminal-name]");
        logger.plainLog("  codestate terminals update          # Interactive mode");
        logger.plainLog("  codestate terminals update <name>   # Update specific terminal");
        process.exit(1);
      }
      break;
    case "delete":
      if (options.length === 0) {
        // Interactive mode - show TUI
        await deleteTerminalCollectionTui();
      } else if (options.length === 1) {
        // Non-interactive mode - delete by ID
        await deleteTerminalCollectionCommand([options[0]]);
      } else {
        logger.error("Error: Too many arguments for delete command");
        logger.plainLog("Usage: codestate terminals delete [terminal-id]");
        logger.plainLog("  codestate terminals delete          # Interactive mode");
        logger.plainLog("  codestate terminals delete <id>     # Delete specific terminal");
        process.exit(1);
      }
      break;
    case "export":
      await exportTerminalCollectionsTui();
      break;
    case "import":
      await importTerminalCollectionsTui();
      break;
    default:
      logger.error(`Error: Unknown terminals subcommand '${subcommand}'`);
      logger.plainLog("Available subcommands: list, create, show, resume, delete, export, import");
      logger.plainLog("Usage:");
      logger.plainLog("  codestate terminals list [--root-path <path>] [--lifecycle <events>]");
      logger.plainLog("  codestate terminals create");
      logger.plainLog("  codestate terminals show [--root-path <path>] [--lifecycle <events>]");
      logger.plainLog("  codestate terminals resume [name] [--root-path <path>] [--lifecycle <events>]");
      logger.plainLog("  codestate terminals delete [terminal-id]");
      logger.plainLog("  codestate terminals export");
      logger.plainLog("  codestate terminals import");
      logger.plainLog("");
      logger.plainLog("Filter options:");
      logger.plainLog("  --root-path <path>     Filter by root path (use '.' for current directory)");
      logger.plainLog("  --lifecycle <events>   Filter by lifecycle events (open, resume, none)");
      logger.plainLog("  --lifecycle open,resume,none  Multiple events separated by commas");
      logger.plainLog("");
      logger.plainLog("Examples:");
      logger.plainLog("  codestate terminals list --root-path .");
      logger.plainLog("  codestate terminals list --lifecycle open,resume");
      logger.plainLog("  codestate terminals resume --root-path /path/to/project");
      logger.plainLog("  codestate terminals resume my-collection --lifecycle open");
      process.exit(1);
  }
}

async function handleListCommand(options: string[]) {
  let rootPath: string | undefined;
  let lifecycleFilter: string[] | undefined;

  // Parse options
  for (let i = 0; i < options.length; i++) {
    if (options[i] === '--root-path' && i + 1 < options.length) {
      rootPath = options[i + 1] === '.' ? process.cwd() : options[i + 1];
      i++; // Skip the next argument
    } else if (options[i] === '--lifecycle' && i + 1 < options.length) {
      lifecycleFilter = options[i + 1].split(',').map(s => s.trim()).filter(s => s);
      i++; // Skip the next argument
    }
  }

  await listTerminalCollectionsCommand(rootPath, lifecycleFilter);
}

async function handleShowCommand(options: string[]) {
  let rootPath: string | undefined;
  let lifecycleFilter: string[] | undefined;

  // Parse options
  for (let i = 0; i < options.length; i++) {
    if (options[i] === '--root-path' && i + 1 < options.length) {
      rootPath = options[i + 1] === '.' ? process.cwd() : options[i + 1];
      i++; // Skip the next argument
    } else if (options[i] === '--lifecycle' && i + 1 < options.length) {
      lifecycleFilter = options[i + 1].split(',').map(s => s.trim()).filter(s => s);
      i++; // Skip the next argument
    }
  }

  await getTerminalCollectionCommand(rootPath, lifecycleFilter);
}

async function handleResumeCommand(options: string[]) {
  let terminalCollectionName: string | undefined;
  let rootPath: string | undefined;
  let lifecycleFilter: string[] | undefined;

  // Parse options
  for (let i = 0; i < options.length; i++) {
    if (options[i] === '--root-path' && i + 1 < options.length) {
      rootPath = options[i + 1] === '.' ? process.cwd() : options[i + 1];
      i++; // Skip the next argument
    } else if (options[i] === '--lifecycle' && i + 1 < options.length) {
      lifecycleFilter = options[i + 1].split(',').map(s => s.trim()).filter(s => s);
      i++; // Skip the next argument
    } else if (!options[i].startsWith('--')) {
      // This is the terminal collection name
      terminalCollectionName = options[i];
    }
  }

  await executeTerminalCollectionCommand(terminalCollectionName, rootPath, lifecycleFilter);
}
