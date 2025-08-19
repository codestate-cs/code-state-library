import inquirer from "@codestate/cli-interface/utils/inquirer";
import { Script, ScriptCommand } from "@codestate/core";
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
        name: "scriptType",
        message: "Script type:",
        type: "list",
        choices: [
          { name: "Single command (legacy)", value: "single" },
          { name: "Multiple commands with priority", value: "multiple" },
        ],
        default: "single",
      },
    ]);

    if (answers.scriptType === "single") {
      // Legacy single command format
      const scriptAnswer = await inquirer.customPrompt([
        {
          name: "script",
          message: "Script command:",
          type: "input",
          validate: (input: string) =>
            input.trim() ? true : "Script command is required",
        },
      ]);

      scripts.push({
        name: answers.name.trim(),
        rootPath: answers.rootPath.trim(),
        script: scriptAnswer.script.trim(),
      });
    } else {
      // New multiple commands format
      const commands: ScriptCommand[] = [];
      let continueAddingCommands = true;
      let commandPriority = 1;

      while (continueAddingCommands) {
        const commandAnswers = await inquirer.customPrompt([
          {
            name: "commandName",
            message: `Command name (${commandPriority}):`,
            type: "input",
            validate: (input: string) =>
              input.trim() ? true : "Command name is required",
          },
          {
            name: "command",
            message: `Command (${commandPriority}):`,
            type: "input",
            validate: (input: string) =>
              input.trim() ? true : "Command is required",
          },
          {
            name: "addAnotherCommand",
            message: "Add another command?",
            type: "confirm",
            default: true,
          },
        ]);

        commands.push({
          name: commandAnswers.commandName.trim(),
          command: commandAnswers.command.trim(),
          priority: commandPriority,
        });

        commandPriority++;
        continueAddingCommands = commandAnswers.addAnotherCommand;
      }

      scripts.push({
        name: answers.name.trim(),
        rootPath: answers.rootPath.trim(),
        commands: commands,
      });
    }

    const addAnotherAnswer = await inquirer.customPrompt([
      {
        name: "addAnother",
        message: "Add another script?",
        type: "confirm",
        default: true,
      },
    ]);

    continueAdding = addAnotherAnswer.addAnother;
  }

  if (scripts.length > 0) {
    await createScriptCommand(scripts);
  }
}
