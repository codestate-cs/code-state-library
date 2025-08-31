import { ConfigurableLogger, ResumeScript, GetScripts, Script } from "@codestate/core";
import inquirer from "../../utils/inquirer";
import { CLISpinner } from "../../utils/CLISpinner";

const getName = (s: Script) => {
  return `${s.name} (${s.rootPath}) \n  Commands:\n   ${s.commands?.map((c) => `Priority: ${c.priority}, Name: ${c.name}, Command: ${c.command}`).join("\n   ")}`
}

export async function resumeScriptCommand(scriptName?: string, rootPath?: string, lifecycleFilter?: string[]) {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const resumeScript = new ResumeScript();
  const getScripts = new GetScripts();

  try {
    let targetScript: Script | undefined;
    let targetRootPath = rootPath || process.cwd();

    // If no script name specified, ask user to select one
    if (!scriptName) {
      // Get scripts for the specified root path or all scripts
      const scriptsResult = await getScripts.execute({
        ...(rootPath && { rootPath: targetRootPath }),
        ...(lifecycleFilter && lifecycleFilter.length > 0 && { lifecycle: lifecycleFilter[0] as any }) // For now, use first filter
      });
      if (!scriptsResult.ok || scriptsResult.value.length === 0) {
        logger.warn("No scripts found");
        return;
      }

      const scripts = scriptsResult.value;
      const { selectedScriptId } = await inquirer.customPrompt([
        {
          type: "list",
          name: "selectedScriptId",
          message: "Select a script to resume:",
          choices: scripts.map((s) => ({
            name: getName(s),
            value: s.id,
          })),
        },
      ]);
      
      // Find the selected script directly
      targetScript = scripts.find(s => s.id === selectedScriptId);
      if (!targetScript) {
        logger.error("Selected script not found");
        return;
      }
    } else {
      // Script name provided, search for matching scripts
      const scriptsResult = await getScripts.execute({
        ...(rootPath && { rootPath: targetRootPath }),
        ...(lifecycleFilter && lifecycleFilter.length > 0 && { lifecycle: lifecycleFilter[0] as any }) // For now, use first filter
      });
      if (!scriptsResult.ok) {
        logger.error("Failed to get scripts");
        return;
      }

      // Find all scripts that match the target name (case-insensitive)
      const matchingScripts = scriptsResult.value.filter(s => 
        s.name.toLowerCase().includes(scriptName.toLowerCase())
      );

      if (matchingScripts.length === 0) {
        logger.error(`No scripts found matching '${scriptName}'`);
        return;
      }

      // If multiple scripts match, let user choose
      if (matchingScripts.length > 1) {
        logger.plainLog(`Found ${matchingScripts.length} scripts matching '${scriptName}':`);
        
        const { selectedScriptId } = await inquirer.customPrompt([
          {
            type: "list",
            name: "selectedScriptId",
            message: "Select a script to resume:",
            choices: matchingScripts.map((s) => ({
              name: getName(s),
              value: s.id,
            })),
          },
        ]);

        targetScript = matchingScripts.find(s => s.id === selectedScriptId);
        if (!targetScript) {
          logger.plainLog("No script selected. Resume cancelled.");
          return;
        }
      } else {
        // Only one script matches
        targetScript = matchingScripts[0];
      }
    }

    // Ensure we have a target script
    if (!targetScript) {
      logger.error("No script selected for execution");
      return;
    }

    logger.plainLog(`📜 Resuming script: "${targetScript.name}" from ${targetScript.rootPath}`);
    spinner.start("⚡ Executing script...");

    // Use the ResumeScript use case
    const result = await resumeScript.execute(targetScript.id);
    
    if (result.ok) {
      spinner.succeed("Script executed successfully");
      logger.log("Script executed successfully");
    } else {
      spinner.fail("Script execution failed");
      logger.error("Script execution failed");
    }

  } catch (error) {
    logger.error("Unexpected error during script resume");
  }
}
