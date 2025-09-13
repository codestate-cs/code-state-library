import { ConfigurableLogger } from "@codestate/core";
import { resumeScriptCommand } from "../../commands/scripts/resumeScript";
import { createScriptTui } from "./createScriptTui";
import { deleteScriptTui } from "./deleteScriptTui";
import { showScriptsTui } from "./showScriptsTui";
import { updateScriptTui } from "./updateScriptTui";
import { resumeScriptTui } from "./resumeScriptTui";
import { exportScriptsTui } from "./exportScriptsTui";
import { importScriptsTui } from "./importScriptsTui";

function showScriptsHelp() {
  const logger = new ConfigurableLogger();
  logger.plainLog(`
    CodeState Scripts - Script Management Commands

    Usage: codestate scripts <subcommand> [options]

    Subcommands:
      show              Show all scripts (supports multi-command format)
      create            Create scripts interactively (single or multi-command)
      update            Update scripts interactively
      delete            Delete scripts interactively
      resume            Execute a script by name (supports multi-command format)
      export            Export scripts to JSON files (interactive selection)
      import            Import scripts from JSON files (interactive)

    Show Command Options:
      codestate scripts show                    # Show all scripts
      codestate scripts show --root-path        # Show scripts in current directory
      codestate scripts show --root-path .      # Show scripts in current directory
      codestate scripts show --root-path <path> # Show scripts in specific path
      codestate scripts show --lifecycle <values> # Filter by lifecycle (none, resume, open)
      codestate scripts show --lifecycle "none, resume" # Multiple values with comma separation

    Resume Command Options:
      codestate scripts resume                    # Show all scripts for selection
      codestate scripts resume <name>             # Resume script by name (searches all paths)
      codestate scripts resume <name> --root-path # Resume script by name in current directory
      codestate scripts resume <name> --root-path . # Resume script by name in current directory
      codestate scripts resume <name> --root-path <path> # Resume script by name in specific path
      codestate scripts resume --root-path        # Show scripts in current directory for selection
      codestate scripts resume --root-path .      # Show scripts in current directory for selection
      codestate scripts resume --root-path <path> # Show scripts in specific path for selection
      codestate scripts resume --lifecycle <values> # Filter by lifecycle (none, resume, open)
      codestate scripts resume --lifecycle "none, resume" # Multiple values with comma separation

    Export Command:
      codestate scripts export                    # Interactive export wizard
      # Supports: All scripts, by project, by ID, by lifecycle, advanced filtering

    Import Command:
      codestate scripts import                    # Interactive import wizard
      # Supports: Downloads folder, custom path, paste content

    Lifecycle Values:
      none     - Scripts with no lifecycle events (manual execution only)
      resume   - Scripts with resume lifecycle events (run when resuming sessions)
      open     - Scripts with open lifecycle events (run when opening projects)

    Examples:
      codestate scripts show
      codestate scripts show --root-path
      codestate scripts show --root-path /home/user/project
      codestate scripts show --lifecycle "resume, open"
      codestate scripts show --lifecycle "none"
      codestate scripts create
      codestate scripts resume
      codestate scripts resume "build-and-test"
      codestate scripts resume "build" --root-path
      codestate scripts resume "test" --root-path /home/user/project
      codestate scripts resume --lifecycle "resume, open"
      codestate scripts resume --lifecycle "none"
      codestate scripts export
      codestate scripts import

    Options:
      --help, -h      Show this help message
`);
}

export async function handleScriptCommand(
  subcommand: string,
  options: string[]
) {
  const logger = new ConfigurableLogger();

  // Show help if no subcommand is provided
  if (!subcommand) {
    showScriptsHelp();
    return;
  }

  // Handle help flag
  if (subcommand === "--help" || subcommand === "-h") {
    showScriptsHelp();
    return;
  }

  switch (subcommand) {
    case "show":
      await handleShowCommand(options);
      break;
    case "create":
      await createScriptTui();
      break;
    case "update":
      await updateScriptTui();
      break;
    case "delete":
      await deleteScriptTui();
      break;
    case "resume":
      await handleResumeCommand(options);
      break;
    case "export":
      await exportScriptsTui();
      break;
    case "import":
      await importScriptsTui();
      break;
    default:
      logger.error(`Error: Unknown scripts subcommand '${subcommand}'`);
      logger.plainLog(
        "Available scripts subcommands: show, create, update, delete, resume, export, import"
      );
      process.exit(1);
  }
}

async function handleShowCommand(options: string[]) {
  const logger = new ConfigurableLogger();
  
  // Parse options
  let rootPath: string | undefined;
  let useCurrentPath = false;
  let lifecycleFilter: string[] | undefined;
  
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
    } else if (option === "--lifecycle") {
      // Check if next option is lifecycle values
      if (i + 1 < options.length && !options[i + 1].startsWith("--")) {
        // Next option contains lifecycle values
        const lifecycleValues = options[i + 1];
        // Split by comma and trim spaces, filter out empty values
        lifecycleFilter = lifecycleValues
          .split(',')
          .map(value => value.trim())
          .filter(value => value.length > 0);
        i++; // Skip the next option since we consumed it
      } else {
        logger.error("Error: --lifecycle requires values (e.g., --lifecycle 'none, resume, open')");
        process.exit(1);
      }
    }
  }
  
  // Handle different show scenarios
  if (rootPath || useCurrentPath) {
    // Show scripts in specific path
    const targetPath = rootPath || process.cwd();
    await showScriptsTui(targetPath, lifecycleFilter);
  } else {
    // Show all scripts
    await showScriptsTui(undefined, lifecycleFilter);
  }
}

async function handleResumeCommand(options: string[]) {
  const logger = new ConfigurableLogger();
  
  // Parse options
  let scriptName: string | undefined;
  let rootPath: string | undefined;
  let useCurrentPath = false;
  let lifecycleFilter: string[] | undefined;
  
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
    } else if (option === "--lifecycle") {
      // Check if next option is lifecycle values
      if (i + 1 < options.length && !options[i + 1].startsWith("--")) {
        // Next option contains lifecycle values
        const lifecycleValues = options[i + 1];
        // Split by comma and trim spaces, filter out empty values
        lifecycleFilter = lifecycleValues
          .split(',')
          .map(value => value.trim())
          .filter(value => value.length > 0);
        i++; // Skip the next option since we consumed it
      } else {
        logger.error("Error: --lifecycle requires values (e.g., --lifecycle 'none, resume, open')");
        process.exit(1);
      }
    } else if (!scriptName && !option.startsWith("--")) {
      // First non-flag option is the script name
      scriptName = option;
    }
  }
  
  // Handle different resume scenarios
  if (scriptName && rootPath) {
    // Resume specific script in specific root path
    await resumeScriptCommand(scriptName, rootPath, lifecycleFilter);
  } else if (scriptName && useCurrentPath) {
    // Resume specific script in current directory
    await resumeScriptCommand(scriptName, process.cwd(), lifecycleFilter);
  } else if (scriptName) {
    // Resume specific script (search all paths)
    await resumeScriptCommand(scriptName, undefined, lifecycleFilter);
  } else if (rootPath || useCurrentPath) {
    // Show scripts in specific path for selection
    await resumeScriptTui(true, lifecycleFilter);
  } else {
    // Show all scripts for selection
    await resumeScriptTui(false, lifecycleFilter);
  }
}
