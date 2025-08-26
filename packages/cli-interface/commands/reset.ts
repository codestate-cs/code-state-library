import { ConfigurableLogger, ResetAll } from "@codestate/core";

export async function resetCommand(options: {
  sessions?: boolean;
  scripts?: boolean;
  terminals?: boolean;
  config?: boolean;
  all?: boolean;
}) {
  const logger = new ConfigurableLogger();
  const resetAll = new ResetAll();

  // Show what will be reset
  const resetItems: string[] = [];
  if (options.all || options.sessions) resetItems.push('sessions');
  if (options.all || options.scripts) resetItems.push('scripts');
  if (options.all || options.terminals) resetItems.push('terminals');
  if (options.all || options.config) resetItems.push('config');

  if (resetItems.length === 0) {
    logger.error("No reset options specified. Use --help to see available options.");
    return;
  }

  logger.warn(`This will permanently delete the following: ${resetItems.join(', ')}`);
  logger.warn("This action cannot be undone!");

  const result = await resetAll.execute(options);
  if (result.ok) {
    logger.log(`Successfully reset: ${result.value.resetItems.join(', ')}`);
    if (options.all) {
      logger.log("🎉 CodeState has been completely reset to a fresh state!");
    }
  } else {
    logger.error("Failed to reset CodeState");
  }
} 