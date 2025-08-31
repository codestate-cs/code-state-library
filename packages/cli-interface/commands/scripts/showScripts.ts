import { ConfigurableLogger, GetScripts } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function showScriptsCommand(rootPath?: string, lifecycleFilter?: string[]) {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const getScripts = new GetScripts();

  spinner.start("📋 Loading scripts...");

  // Build options for GetScripts
  const options: any = {};
  if (rootPath) {
    options.rootPath = rootPath;
  }
  if (lifecycleFilter && lifecycleFilter.length > 0) {
    options.lifecycle = lifecycleFilter[0]; // For now, use first filter
  }

  const result = await getScripts.execute(Object.keys(options).length > 0 ? options : undefined);

  if (result.ok) {
    spinner.succeed("Scripts loaded");

    const scripts = result.value;

    if (scripts.length === 0) {
      if (rootPath) {
        logger.plainLog(`\n📝 No scripts found for ${rootPath}.`);
      } else {
        logger.plainLog("\n📝 No scripts found.");
      }
      logger.plainLog(
        "Use `codestate scripts create` to add your first script.\n"
      );
      return;
    }

    // Group scripts by rootPath
    const scriptsByPath = new Map<string, typeof scripts>();
    scripts.forEach((script) => {
      if (!scriptsByPath.has(script.rootPath)) {
        scriptsByPath.set(script.rootPath, []);
      }
      scriptsByPath.get(script.rootPath)!.push(script);
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

    logger.plainLog("\n📝 Scripts by Project Path:");
    logger.plainLog("───────────────────────────");

    scriptsByPath.forEach((pathScripts, rootPath) => {
      logger.plainLog(
        `\n📁 ${rootPath} (${pathScripts.length} script${pathScripts.length > 1 ? "s" : ""
        })`
      );
      logger.plainLog("─".repeat(rootPath.length + 10));

      pathScripts.forEach((script) => {
        const executionMode = (script as any).executionMode || 'same-terminal';
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
          logger.plainLog(`  • ${script.name} - ${script.script} ${modeIcon} (${modeText}${closeInfo})`);
        } else if ((script as any).commands && (script as any).commands.length > 0) {
          // New multi-command format
          logger.plainLog(`  • ${script.name} ${modeIcon} (${modeText}${closeInfo}):`);
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
    });

    logger.plainLog("");
  } else {
    spinner.fail("Failed to load scripts");
    logger.error("Failed to load scripts");
  }
}
