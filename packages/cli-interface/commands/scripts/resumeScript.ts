import { ConfigurableLogger, GetScriptsByRootPath, Terminal } from "@codestate/core";
import inquirer from "../../utils/inquirer";

export async function resumeScriptCommand(scriptName?: string, rootPath?: string) {
  const logger = new ConfigurableLogger();
  const getScriptsByRootPath = new GetScriptsByRootPath();
  const terminal = new Terminal();

  try {
    // If no script name specified, ask user to select one
    let targetScriptName = scriptName;
    let targetRootPath = rootPath || process.cwd();

    if (!targetScriptName) {
      // Get all scripts for the current directory
      const scriptsResult = await getScriptsByRootPath.execute(targetRootPath);
      if (!scriptsResult.ok || scriptsResult.value.length === 0) {
        logger.warn("No scripts found for the current directory.");
        return;
      }

      const scripts = scriptsResult.value;
      const { selectedScript } = await inquirer.customPrompt([
        {
          type: "list",
          name: "selectedScript",
          message: "Select a script to resume:",
          choices: scripts.map((s) => ({
            name: `${s.name} - ${s.script || 'Multi-command script'}`,
            value: s.name,
          })),
        },
      ]);
      targetScriptName = selectedScript || "";
    }

    // Ensure targetScriptName is not empty
    if (!targetScriptName || !targetScriptName.trim()) {
      logger.plainLog("No script specified. Resume cancelled.");
      return;
    }

    // Get scripts for the target path
    const scriptsResult = await getScriptsByRootPath.execute(targetRootPath);
    if (!scriptsResult.ok) {
      logger.error("Failed to get scripts", { error: scriptsResult.error });
      return;
    }

    // Find the target script
    const targetScript = scriptsResult.value.find(s => s.name === targetScriptName);
    if (!targetScript) {
      logger.error(`Script '${targetScriptName}' not found in ${targetRootPath}`);
      return;
    }

    logger.plainLog(`\n📜 Resuming script: "${targetScript.name}"`);
    logger.plainLog(`📍 Path: ${targetRootPath}`);

    // Execute the script
    if (targetScript.script) {
      // Legacy single command format
      logger.plainLog(`\n🔄 Running: ${targetScript.script}`);
      const scriptResult = await terminal.execute(targetScript.script, {
        cwd: targetRootPath,
        timeout: 30000, // 30 seconds timeout for script execution
      });
      
      if (scriptResult.ok && scriptResult.value.success) {
        logger.plainLog(`\n✅ Script '${targetScript.name}' completed successfully`);
        logger.plainLog(`⏱️  Duration: ${scriptResult.value.duration}ms`);
      } else {
        logger.error(`\n❌ Script '${targetScript.name}' failed`, {
          error: scriptResult.ok ? scriptResult.value : scriptResult.error,
        });
      }
    } else if ((targetScript as any).commands && (targetScript as any).commands.length > 0) {
      // New multi-command format - execute commands one by one
      const commands = (targetScript as any).commands.sort((a: any, b: any) => a.priority - b.priority);
      
      logger.plainLog(`\n🔄 Executing ${commands.length} command(s) in sequence:`);
      
      for (const cmd of commands) {
        logger.plainLog(`\n  ${cmd.priority}. Running: ${cmd.name} - ${cmd.command}`);
        const cmdResult = await terminal.execute(cmd.command, {
          cwd: targetRootPath,
          timeout: 30000, // 30 seconds timeout per command
        });
        
        if (cmdResult.ok && cmdResult.value.success) {
          logger.plainLog(`    ✅ Command '${cmd.name}' completed successfully`);
          logger.plainLog(`    ⏱️  Duration: ${cmdResult.value.duration}ms`);
        } else {
          logger.error(`    ❌ Command '${cmd.name}' failed`, {
            error: cmdResult.ok ? cmdResult.value : cmdResult.error,
          });
          // Continue with next command even if this one fails
        }
        
        // Small delay between commands to avoid overwhelming the system
        if (cmd.priority < commands.length) {
          logger.plainLog(`    ⏳ Waiting 1 second before next command...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      
      logger.plainLog(`\n✅ Script '${targetScript.name}' execution completed`);
    } else {
      logger.warn(`\n⚠️  Script '${targetScript.name}' has no commands to execute`);
    }

  } catch (error) {
    logger.error("Unexpected error during script resume", { error });
  }
}
