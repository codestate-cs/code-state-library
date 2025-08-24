import { resetTui } from "./resetTui";
import { resetCommand } from "../../commands/reset";
import { ConfigurableLogger } from "@codestate/core";

export async function handleResetCommand(subcommand: string, options: string[]) {
  const logger = new ConfigurableLogger();

  // Check for help flag first
  if (options.includes("--help") || options.includes("-h")) {
    showResetHelp();
    return;
  }

  // Parse command line options
  const resetOptions: any = {};
  
  for (const option of options) {
    if (option === "--all" || option === "-a") {
      resetOptions.all = true;
    } else if (option === "--sessions" || option === "-s") {
      resetOptions.sessions = true;
    } else if (option === "--scripts" || option === "-sc") {
      resetOptions.scripts = true;
    } else if (option === "--terminals" || option === "-t") {
      resetOptions.terminals = true;
    } else if (option === "--config" || option === "-c") {
      resetOptions.config = true;
    } else if (option === "--help" || option === "-h") {
      // Already handled above
      continue;
    } else {
      logger.error(`Unknown option: ${option}`);
      showResetHelp();
      return;
    }
  }

  // If no options specified, show interactive TUI
  if (Object.keys(resetOptions).length === 0) {
    await resetTui();
    return;
  }

  // Execute reset command with parsed options
  await resetCommand(resetOptions);
}

function showResetHelp() {
  const logger = new ConfigurableLogger();
  logger.plainLog(`
🔄 CodeState Reset Command

Usage: codestate reset [options]

Options:
  --all, -a              Reset everything (sessions, scripts, terminals, config)
  --sessions, -s         Reset all sessions
  --scripts, -sc         Reset all scripts
  --terminals, -t        Reset all terminal collections
  --config, -c           Reset configuration to defaults
  --help, -h             Show this help message

Examples:
  codestate reset --all                    # Reset everything
  codestate reset --sessions --scripts     # Reset sessions and scripts only
  codestate reset                          # Interactive mode (no options)

⚠️  Warning: This will permanently delete the selected items!
`);
} 