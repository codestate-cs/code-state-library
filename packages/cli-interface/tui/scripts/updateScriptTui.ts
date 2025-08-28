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
    
    // Default execution mode to new-terminals
    scriptUpdate.executionMode = 'new-terminals';
    scriptUpdate.closeTerminalAfterExecution = false; // Default to keep terminal open
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
    
    // Default execution mode to new-terminals
    scriptUpdate.executionMode = 'new-terminals';
    
    // Ask about terminal close behavior
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

  await updateScriptCommand(
    answers.name.trim(),
    answers.rootPath.trim(),
    scriptUpdate
  );
}
