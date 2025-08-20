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
  scripts show-by-path      Show scripts for specific root path
  scripts create            Create scripts interactively (single or multi-command)
  scripts update            Update scripts interactively
  scripts delete            Delete scripts interactively
  scripts delete-by-path    Delete all scripts for a root path
  scripts export            Export scripts to JSON
  scripts import            Import scripts from JSON
  scripts resume            Execute a script by name (supports multi-command format)
  
  session save              Save current session (captures terminal commands)
  session resume            Resume a saved session (restores terminal commands & file order)
  session update            Update a saved session
  session list              List all sessions with metadata
  session delete            Delete a session

Features:
  • Terminal Command Capture: Sessions automatically capture running terminal commands
  • File Position Ordering: Files are opened in the correct sequence when resuming
  • Multi-Command Scripts: Scripts can contain multiple commands with priority
  • Git Integration: Full Git state capture and restoration
  • Cross-Platform: Works on Windows, macOS, and Linux

Examples:
  codestate config show
  codestate config edit
  codestate scripts show
  codestate scripts create
  codestate scripts show-by-path /home/user/project
  codestate scripts resume
  codestate scripts resume "build-and-test"
  codestate session save "Feature Work"
  codestate session resume "Feature Work"

Options:
  --help, -h      Show this help message
  --version, -v   Show version information
`);
}

function showVersion() {
  logger.plainLog("CodeState CLI v1.0.0");
}

async function main() {
  // Handle help and version flags
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  if (args.includes("--version") || args.includes("-v")) {
    showVersion();
    return;
  }

  // Parse command
  const [command, subcommand, ...options] = args;

  if (!command) {
    logger.error("Error: No command specified");
    showHelp();
    process.exit(1);
  }

  try {
    await handleCommand(command, subcommand, options);
  } catch (error) {
    logger.error("Error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

main();
