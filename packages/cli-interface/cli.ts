#!/usr/bin/env node

import { handleCommand } from './commands';

// Get command line arguments
const args = process.argv.slice(2);

// Handle graceful exit
process.on('SIGINT', () => {
  console.log('\n👋 You have exited CodeState CLI');
  process.exit(0);
});

function showHelp() {
  console.log(`
CodeState CLI - Configuration, Script, and Git Management

Usage: codestate <command> [options]

Commands:
  config show     Show current configuration
  config edit     Edit configuration interactively
  config reset    Reset configuration to defaults
  config export   Export configuration to file
  config import   Import configuration from file
  
  scripts show              Show all scripts
  scripts show-by-path      Show scripts for specific root path
  scripts create            Create scripts interactively
  scripts update            Update scripts interactively
  scripts delete            Delete scripts interactively
  scripts delete-by-path    Delete all scripts for a root path
  scripts export            Export scripts to JSON
  scripts import            Import scripts from JSON

Examples:
  codestate config show
  codestate config edit
  codestate scripts show
  codestate scripts create
  codestate scripts show-by-path /home/user/project

Options:
  --help, -h      Show this help message
  --version, -v   Show version information
`);
}

function showVersion() {
  console.log('CodeState CLI v1.0.0');
}

async function main() {
  // Handle help and version flags
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    return;
  }

  // Parse command
  const [command, subcommand, ...options] = args;

  if (!command) {
    console.error('Error: No command specified');
    showHelp();
    process.exit(1);
  }

  try {
    await handleCommand(command, subcommand, options);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main(); 