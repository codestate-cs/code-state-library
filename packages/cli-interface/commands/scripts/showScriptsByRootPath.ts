import { ConfigurableLogger, GetScriptsByRootPath } from "@codestate/core";

export async function showScriptsByRootPathCommand(rootPath: string) {
  const logger = new ConfigurableLogger();
  const getScriptsByRootPath = new GetScriptsByRootPath();
  const result = await getScriptsByRootPath.execute(rootPath);
  if (result.ok) {
    const scripts = result.value;
    
    if (scripts.length === 0) {
      logger.plainLog(`\n📝 No scripts found for ${rootPath}.`);
      return;
    }

    logger.plainLog(`\n📝 Scripts for ${rootPath}:`);
    logger.plainLog("─".repeat(rootPath.length + 15));

    scripts.forEach((script) => {
      if (script.script) {
        // Legacy single command format
        logger.plainLog(`  • ${script.name} - ${script.script}`);
      } else if ((script as any).commands && (script as any).commands.length > 0) {
        // New multi-command format
        logger.plainLog(`  • ${script.name}:`);
        (script as any).commands
          .sort((a: any, b: any) => a.priority - b.priority)
          .forEach((cmd: any) => {
            logger.plainLog(`    ${cmd.priority}. ${cmd.name} - ${cmd.command}`);
          });
      } else {
        // Fallback for empty scripts
        logger.plainLog(`  • ${script.name} - (no commands)`);
      }
    });

    logger.plainLog("");
  } else {
    logger.error("Failed to load scripts for root path", {
      error: result.error,
      rootPath,
    });
  }
}
