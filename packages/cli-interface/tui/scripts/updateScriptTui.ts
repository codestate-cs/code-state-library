import inquirer from "@codestate/cli-interface/utils/inquirer";
import { Script } from "@codestate/core";
import { updateScriptCommand } from "../../commands/scripts/updateScript";

export async function updateScriptTui() {
  const currentPath = process.cwd();
  const answers = await inquirer.customPrompt([
    {
      name: "name",
      message: "Script name to update:",
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
      name: "newName",
      message: "New script name (leave empty to keep current):",
      type: "input",
    },
    {
      name: "updateType",
      message: "What would you like to update?",
      type: "list",
      choices: [
        { name: "Single command (legacy)", value: "single" },
        { name: "Multiple commands with priority", value: "multiple" },
      ],
      default: "single",
    },
  ]);

  const scriptUpdate: Partial<Script> = {};
  if (answers.newName.trim()) {
    scriptUpdate.name = answers.newName.trim();
  }

  if (answers.updateType === "single") {
    // Legacy single command update
    const scriptAnswer = await inquirer.customPrompt([
      {
        name: "newScript",
        message: "New script command (leave empty to keep current):",
        type: "input",
      },
    ]);

    if (scriptAnswer.newScript.trim()) {
      scriptUpdate.script = scriptAnswer.newScript.trim();
    }
    
    // Ask for execution mode
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
    
    scriptUpdate.executionMode = executionModeAnswer.executionMode;
    
    // Ask about terminal close behavior only if new terminal mode is selected
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
      scriptUpdate.closeTerminalAfterExecution = closeAnswer.closeTerminalAfterExecution;
    }
  } else {
    // New multi-command update
    const commands: any[] = [];
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

    if (commands.length > 0) {
      scriptUpdate.commands = commands;
    }
    
    // Ask for execution mode
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
    
    scriptUpdate.executionMode = executionModeAnswer.executionMode;
    
    // Ask about terminal close behavior only if new terminal mode is selected
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
      scriptUpdate.closeTerminalAfterExecution = closeAnswer.closeTerminalAfterExecution;
    }
  }

  await updateScriptCommand(
    answers.name.trim(),
    answers.rootPath.trim(),
    scriptUpdate
  );
}
