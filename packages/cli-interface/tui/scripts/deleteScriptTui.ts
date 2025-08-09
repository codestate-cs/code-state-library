import inquirer from "@codestate/cli-interface/utils/inquirer";
import { ConfigurableLogger } from "@codestate/core";
import { deleteScriptCommand } from "../../commands/scripts/deleteScript";

export async function deleteScriptTui() {
  const logger = new ConfigurableLogger();
  const currentPath = process.cwd();
  const answers = await inquirer.customPrompt([
    {
      name: "name",
      message: "Script name to delete:",
      type: "input",
      validate: (input: string) =>
        input.trim() ? true : "Script name is required",
    },
    {
      name: "rootPath",
      message: `Root path (current: ${currentPath}):`,
      type: "input",
      default: currentPath,
      validate: (input: string) =>
        input.trim() ? true : "Root path is required",
    },
    {
      name: "confirm",
      message: "Are you sure you want to delete this script?",
      type: "confirm",
      default: false,
    },
  ]);

  if (answers.confirm) {
    await deleteScriptCommand(answers.name.trim(), answers.rootPath.trim());
  } else {
    logger.plainLog("Script deletion cancelled.");
  }
}
