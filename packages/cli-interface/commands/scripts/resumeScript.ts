import { ConfigurableLogger, GetScriptsByRootPath, Terminal } from "@codestate/core";
import inquirer from "../../utils/inquirer";
import { CLISpinner } from "../../utils/CLISpinner";

export async function resumeScriptCommand(scriptName?: string, rootPath?: string) {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
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
      logger.error("Failed to get scripts");
      return;
    }

    // Find the target script
    const targetScript = scriptsResult.value.find(s => s.name === targetScriptName);
    if (!targetScript) {
      logger.error(`Script '${targetScriptName}' not found in ${targetRootPath}`);
      return;
    }

    logger.plainLog(`📜 Resuming script: "${targetScript.name}"`);

    // Execute the script based on execution mode
    const executionMode = (targetScript as any).executionMode || 'same-terminal';
    
    if (targetScript.script) {
      // Legacy single command format
      if (executionMode === 'new-terminals') {
        spinner.start("🚀 Spawning new terminal...");
        
        // Check if terminal should close after execution
        const closeAfterExecution = (targetScript as any).closeTerminalAfterExecution || false;
        
        // Modify command based on close behavior
        let finalCommand = targetScript.script;
        if (closeAfterExecution) {
          finalCommand = `${targetScript.script} && echo "Script execution completed. Closing terminal..." && sleep 2 && exit`;
        } else {
          finalCommand = `${targetScript.script} && echo 'Script execution completed. Terminal will remain open.'`;
        }
        
        const spawnResult = await terminal.spawnTerminal(finalCommand, {
          cwd: targetRootPath,
          timeout: 5000,
        });
        
        if (spawnResult.ok) {
          spinner.succeed("Script executed in new terminal");
          logger.log("Script executed in new terminal");
        } else {
          spinner.fail("Failed to spawn terminal");
          logger.error("Failed to spawn terminal");
        }
      } else {
        // Same terminal execution
        spinner.start("⚡ Executing script...");
        
        const scriptResult = await terminal.execute(targetScript.script, {
          cwd: targetRootPath,
          timeout: 30000,
        });
        
        if (scriptResult.ok && scriptResult.value.success) {
          spinner.succeed("Script completed successfully");
          logger.log("Script completed successfully");
        } else {
          spinner.fail("Script failed");
          logger.error("Script failed");
        }
      }
    } else if ((targetScript as any).commands && (targetScript as any).commands.length > 0) {
      // New multi-command format
      const commands = (targetScript as any).commands.sort((a: any, b: any) => a.priority - b.priority);
      
      if (executionMode === 'new-terminals') {
        spinner.start("🚀 Spawning new terminal...");
        
        // Create a combined command that runs all commands in sequence
        const combinedCommand = commands
          .sort((a: any, b: any) => a.priority - b.priority)
          .map((cmd: any) => cmd.command)
          .join(' && ');
        
        // Check if terminal should close after execution
        const closeAfterExecution = (targetScript as any).closeTerminalAfterExecution || false;
        
        // Modify command based on close behavior
        let finalCommand = combinedCommand;
        if (closeAfterExecution) {
          finalCommand = `${combinedCommand} && echo "Script execution completed. Closing terminal..." && sleep 2 && exit`;
        } else {
          finalCommand = `${combinedCommand} && echo 'Script execution completed. Terminal will remain open.'`;
        }
        
        const spawnResult = await terminal.spawnTerminal(finalCommand, {
          cwd: targetRootPath,
          timeout: 5000,
        });
        
        if (spawnResult.ok) {
          spinner.succeed("Script executed in new terminal");
          logger.log("Script executed in new terminal");
        } else {
          spinner.fail("Failed to spawn terminal");
          logger.error("Failed to spawn terminal");
        }
      } else {
        // Execute commands in sequence in the same terminal
        spinner.start("⚡ Executing script commands...");
        
        for (const cmd of commands) {
          spinner.update(`⚡ Executing command: ${cmd.name}`);
          
          const cmdResult = await terminal.execute(cmd.command, {
            cwd: targetRootPath,
            timeout: 30000,
          });
          
          if (!cmdResult.ok || !cmdResult.value.success) {
            spinner.fail(`Command '${cmd.name}' failed`);
            logger.error(`Command '${cmd.name}' failed`);
            return;
          }
          
          // Small delay between commands
          if (cmd.priority < commands.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
        
        spinner.succeed("Script completed successfully");
        logger.log("Script completed successfully");
      }
    } else {
      logger.warn("Script has no commands to execute");
    }

  } catch (error) {
    logger.error("Unexpected error during script resume");
  }
}
