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
  
  terminals list            List all terminal collections
  terminals create          Create a new terminal collection interactively
  terminals show <name>     Show specific terminal collection details
  terminals resume <name>   Execute a terminal collection
  
  reset [options]           Reset CodeState data (sessions, scripts, terminals, config)

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
  codestate terminals list
  codestate terminals create
  codestate terminals show "my-project"
  codestate terminals resume "my-project"

Options:
  --help, -h      Show this help message
  --version, -v   Show version information
`);
}

function showVersion() {
  logger.plainLog("CodeState CLI v1.0.0");
}

async function main() {
  try {
    // Check for version upgrade and perform automatic reset if needed
    const { CheckVersionUpgrade } = await import("@codestate/core");
    const versionChecker = new CheckVersionUpgrade();
    const versionResult = await versionChecker.execute();
    
    if (!versionResult.ok) {
      logger.warn("Version check failed, continuing with normal operation", { 
        error: versionResult.error 
      });
    }
  } catch (error) {
    // If version check fails, continue with normal operation
    logger.log("Version check failed, continuing with normal operation", { error });
  }

  // Parse command first
  const [command, subcommand, ...options] = args;

  // Handle help and version flags only if no command is specified
  if (!command) {
    if (args.includes("--help") || args.includes("-h")) {
      showHelp();
      return;
    }
    if (args.includes("--version") || args.includes("-v")) {
      showVersion();
      return;
    }
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
