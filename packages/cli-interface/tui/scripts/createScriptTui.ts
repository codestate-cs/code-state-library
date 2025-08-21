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

      // Ask for execution mode for single command scripts
      const executionModeAnswer = await inquirer.customPrompt([
        {
          name: "executionMode",
          message: "How should this command be executed?",
          type: "list",
          choices: [
            { name: "Same terminal (run in current terminal)", value: "same-terminal" },
            { name: "New terminal (open new terminal window and run)", value: "new-terminals" },
          ],
          default: "same-terminal",
        },
      ]);

      // Ask about terminal close behavior only if new terminal mode is selected
      let closeTerminalAfterExecution = false;
      if (executionModeAnswer.executionMode === 'new-terminals') {
        const closeAnswer = await inquirer.customPrompt([
          {
            name: "closeTerminalAfterExecution",
            message: "Should the terminal close after running the command?",
            type: "list",
            choices: [
              { name: "Keep terminal open (useful for debugging, manual follow-up)", value: false },
              { name: "Close terminal automatically (clean exit)", value: true },
            ],
            default: false,
          },
        ]);
        closeTerminalAfterExecution = closeAnswer.closeTerminalAfterExecution;
      }

      scripts.push({
        name: answers.name.trim(),
        rootPath: answers.rootPath.trim(),
        script: scriptAnswer.script.trim(),
        executionMode: executionModeAnswer.executionMode,
        closeTerminalAfterExecution,
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

      // Ask for execution mode for multi-command scripts
      const executionModeAnswer = await inquirer.customPrompt([
        {
          name: "executionMode",
          message: "How should these commands be executed?",
          type: "list",
          choices: [
            { name: "Same terminal (run all commands in sequence)", value: "same-terminal" },
            { name: "New terminal (open new terminal window and run all commands in sequence)", value: "new-terminals" },
          ],
          default: "same-terminal",
        },
      ]);

      // Ask about terminal close behavior only if new terminal mode is selected
      let closeTerminalAfterExecution = false;
      if (executionModeAnswer.executionMode === 'new-terminals') {
        const closeAnswer = await inquirer.customPrompt([
          {
            name: "closeTerminalAfterExecution",
            message: "Should the terminal close after running all commands?",
            type: "list",
            choices: [
              { name: "Keep terminal open (useful for debugging, manual follow-up)", value: false },
              { name: "Close terminal automatically (clean exit)", value: true },
            ],
            default: false,
          },
        ]);
        closeTerminalAfterExecution = closeAnswer.closeTerminalAfterExecution;
      }

      scripts.push({
        name: answers.name.trim(),
        rootPath: answers.rootPath.trim(),
        commands: commands,
        executionMode: executionModeAnswer.executionMode,
        closeTerminalAfterExecution,
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
