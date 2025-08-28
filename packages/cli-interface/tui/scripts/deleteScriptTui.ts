import inquirer from "@codestate/cli-interface/utils/inquirer";
import { ConfigurableLogger, GetScripts } from "@codestate/core";
import { deleteScriptCommand } from "../../commands/scripts/deleteScript";

export async function deleteScriptTui() {
  const logger = new ConfigurableLogger();
  const getScripts = new GetScripts();
  
  // Get all available scripts
  const scriptsResult = await getScripts.execute();
  if (!scriptsResult.ok || scriptsResult.value.length === 0) {
    logger.warn("No scripts found to delete.");
    return;
  }

  const scripts = scriptsResult.value;
  const { selectedScript, confirm } = await inquirer.customPrompt([
    {
      type: "list",
      name: "selectedScript",
      message: "Select a script to delete:",
      choices: scripts.map((script: any) => ({
        name: `${script.name} (${script.rootPath})`,
        value: script.id,
      })),
    },
    {
      name: "confirm",
      message: "Are you sure you want to delete this script?",
      type: "confirm",
      default: false,
    },
  ]);

  if (confirm) {
    await deleteScriptCommand(selectedScript);
  } else {
    logger.plainLog("Script deletion cancelled.");
  }
}
