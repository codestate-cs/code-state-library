import { TerminalCollectionFacade, ConfigurableLogger, isSuccess, isFailure } from '@codestate/core';
import { CLISpinner } from '../../utils/CLISpinner';

export async function getTerminalCollectionCommand(rootPath?: string, lifecycleFilter?: string[]) {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const terminalCollectionService = new TerminalCollectionFacade();
  
  spinner.start("📋 Loading terminal collections...");
  
  // Build options for getTerminalCollections
  const options: any = { loadScripts: true };
  if (rootPath) {
    options.rootPath = rootPath;
  }
  if (lifecycleFilter && lifecycleFilter.length > 0) {
    options.lifecycle = lifecycleFilter[0]; // For now, use first filter
  }
  
  const result = await terminalCollectionService.getTerminalCollections(Object.keys(options).length > 1 ? options : { loadScripts: true });
  
  if (isFailure(result)) {
    spinner.fail("Failed to load terminal collections");
    logger.error('Failed to get terminal collections');
    process.exit(1);
  }
  
  spinner.succeed("Terminal collections loaded");
  
  const terminalCollections = result.value;

  if (terminalCollections.length === 0) {
    if (rootPath) {
      logger.plainLog(`\n📝 No terminal collections found for ${rootPath}.`);
    } else {
      logger.plainLog("\n📝 No terminal collections found.");
    }
    logger.plainLog(
      "Use `codestate terminals create` to add your first terminal collection.\n"
    );
    return;
  }

  // Group terminal collections by rootPath
  const collectionsByPath = new Map<string, typeof terminalCollections>();
  terminalCollections.forEach((collection: any) => {
    if (!collectionsByPath.has(collection.rootPath)) {
      collectionsByPath.set(collection.rootPath, []);
    }
    collectionsByPath.get(collection.rootPath)!.push(collection);
  });

  // Show filter info if filters are applied
  if (rootPath || lifecycleFilter) {
    logger.plainLog("\n🔍 Applied Filters:");
    if (rootPath) {
      logger.plainLog(`  • Root Path: ${rootPath}`);
    }
    if (lifecycleFilter && lifecycleFilter.length > 0) {
      logger.plainLog(`  • Lifecycle: ${lifecycleFilter.join(', ')}`);
    }
    logger.plainLog("");
  }

  logger.plainLog("\n📁 Terminal Collections by Project Path:");
  logger.plainLog("─────────────────────────────────────────");

  collectionsByPath.forEach((pathCollections, rootPath) => {
    logger.plainLog(
      `\n📁 ${rootPath} (${pathCollections.length} collection${
        pathCollections.length > 1 ? "s" : ""
      })`
    );
    logger.plainLog("─".repeat(rootPath.length + 15));

    pathCollections.forEach((collection: any) => {
      logger.plainLog(`  • ${collection.name}`);
      logger.plainLog(`    Lifecycle: ${collection.lifecycle.join(', ')}`);
      logger.plainLog(`    Scripts: ${collection.scripts.length}`);
      
      if (collection.scripts.length > 0) {
        collection.scripts.forEach((script: any) => {
          const executionMode = (script as any).executionMode || 'new-terminals';
          const modeIcon = executionMode === 'new-terminals' ? '📱' : '🖥️';
          const modeText = executionMode === 'new-terminals' ? 'new terminal' : 'same terminal';
          
          // Add close behavior info for new terminal scripts
          let closeInfo = '';
          if (executionMode === 'new-terminals') {
            const closeAfterExecution = (script as any).closeTerminalAfterExecution || false;
            closeInfo = closeAfterExecution ? ' (auto-close)' : ' (keep open)';
          }
          
          if (script.script) {
            // Legacy single command format
            logger.plainLog(`    └── ${script.name} - ${script.script} ${modeIcon} (${modeText}${closeInfo})`);
          } else if ((script as any).commands && (script as any).commands.length > 0) {
            // New multi-command format
            logger.plainLog(`    └── ${script.name} ${modeIcon} (${modeText}${closeInfo}):`);
            (script as any).commands
              .sort((a: any, b: any) => a.priority - b.priority)
              .forEach((cmd: any) => {
                logger.plainLog(`      ${cmd.priority}. ${cmd.name} - ${cmd.command}`);
              });
          } else {
            // Fallback for empty scripts
            logger.plainLog(`    └── ${script.name} - (no commands)`);
          }
        });
      }
    });
  });

  logger.plainLog("");
}