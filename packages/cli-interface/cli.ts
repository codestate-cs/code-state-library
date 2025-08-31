#!/usr/bin/env node

import { ConfigurableLogger } from "@codestate/core";
import { handleCommand } from "./commands";

// Get command line arguments
const args = process.argv.slice(2);
const logger = new ConfigurableLogger();

// Handle graceful exit
process.on("SIGINT", () => {
  logger.plainLog("\n👋 You have exited CodeState CLI");
  process.exit(0);
});

function showHelp() {
  logger.plainLog(`
CodeState CLI - Configuration, Script, and Session Management

Usage: codestate <command> [options]

Commands:
  config show     Show current configuration
  config edit     Edit configuration interactively
  config reset    Reset configuration to defaults
  config export   Export configuration to file
  config import   Import configuration from file
  
  scripts show              Show all scripts (supports multi-command format)
  scripts create            Create scripts interactively (single or multi-command)
  scripts update            Update scripts interactively
  scripts delete            Delete scripts interactively
  scripts resume            Execute a script by name (supports multi-command format)
  scripts export            Export scripts to JSON files (interactive selection)
  scripts import            Import scripts from JSON files (interactive)
  
  sessions save              Save current session (captures terminal commands)
  sessions resume            Resume a saved session (restores terminal commands & file order)
  sessions update            Update a saved session
  sessions list              List all sessions with metadata
  sessions delete            Delete a session
  sessions export            Export sessions to JSON files (interactive selection)
  sessions import            Import sessions from JSON files (interactive)
  
  terminals list            List all terminal collections (supports filtering)
  terminals create          Create a new terminal collection interactively
  terminals show            Show all terminal collections (supports filtering)
  terminals resume [name]   Execute a terminal collection (supports filtering)
  terminals delete          Delete terminal collections interactively
  terminals export          Export terminal collections to JSON files (interactive selection)
  terminals import          Import terminal collections from JSON files (interactive)
  
  reset [options]           Reset CodeState data (sessions, scripts, terminals, config, all)

Features:
  • Terminal Command Capture: Sessions automatically capture running terminal commands
  • File Position Ordering: Files are opened in the correct sequence when resuming
  • Multi-Command Scripts: Scripts can contain multiple commands with priority
  • Git Integration: Full Git state capture and restoration
  • Cross-Platform: Works on Windows, macOS, and Linux

Getting Help:
  codestate --help                    # Show this help message
  codestate config                    # Show config command help
  codestate scripts                   # Show scripts command help
  codestate sessions                  # Show sessions command help
  codestate terminals                 # Show terminals command help
  codestate reset --help              # Show reset command help

Examples:
  codestate config show
  codestate config edit
  codestate scripts show
  codestate scripts create
  codestate scripts resume "build-and-test"
  codestate sessions save "Feature Work"
  codestate sessions resume "Feature Work"
  codestate terminals list
  codestate terminals create
  codestate reset --all

Options:
  --help, -h      Show this help message
  --version, -v   Show version information
`);
}

function showVersion() {
  logger.plainLog("CodeState CLI v1.0.0");
}

async function main() {
  // Handle help and version flags first

  // Parse command first
  const [command, subcommand, ...options] = args;


  if (command === "--help" || command === "-h") {
    showHelp();
    return;
  }
  if (command === "--version" || command === "-v") {
    showVersion();
    return;
  }

  // Handle case when no command is specified
  if (!command) {
    logger.error("Error: No command specified");
    showHelp();
    process.exit(1);
  }

  try {
    await handleCommand(command, subcommand, options);
  } catch (error) {
    console.log(error);
    logger.error("Error: An unexpected error occurred");
    process.exit(1);
  }
}

main();
