import inquirer from "@codestate/cli-interface/utils/inquirer";
import { Script } from "@codestate/core";
import { createScriptCommand } from "../../commands/scripts/createScript";

export async function createScriptTui() {
  await createScriptsInteractively();
}

async function createScriptsInteractively() {
  const scripts: Script[] = [];
  let continueAdding = true;
  const currentPath = process.cwd();

  while (continueAdding) {
    const answers = await inquirer.customPrompt([
      {
        name: "name",
        message: `Script name (${scripts.length + 1}):`,
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
        name: "script",
        message: "Script command:",
        type: "input",
        validate: (input: string) =>
          input.trim() ? true : "Script command is required",
      },
      {
        name: "addAnother",
        message: "Add another script?",
        type: "confirm",
        default: true,
      },
    ]);

    scripts.push({
      name: answers.name.trim(),
      rootPath: answers.rootPath.trim(),
      script: answers.script.trim(),
    });

    continueAdding = answers.addAnother;
  }

  if (scripts.length > 0) {
    await createScriptCommand(scripts);
  }
}
