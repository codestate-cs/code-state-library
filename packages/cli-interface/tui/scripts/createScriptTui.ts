import inquirer from "@codestate/cli-interface/utils/inquirer";
import { Script, ScriptCommand } from "@codestate/core";
import { createScriptCommand } from "../../commands/scripts/createScript";
import { randomUUID } from "crypto";
import { ConfigurableLogger } from "@codestate/core";

export async function createScriptTui() {
  await createScriptsInteractively();
}

async function createScriptsInteractively() {
  let continueAdding = true;
  const currentPath = process.cwd();
  const logger = new ConfigurableLogger();

  while (continueAdding) {
    const answers = await inquirer.customPrompt([
      {
        name: "name",
        message: "Script name:",
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

    let script: Script;

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

      // Ask about lifecycle events
      const lifecycleAnswer = await inquirer.customPrompt([
        {
          name: "lifecycle",
          message: "When should this script be executed?",
          type: "checkbox",
          choices: [
            { 
              name: "Open - Run when opening a project (e.g., start dev servers)", 
              value: "open",
              checked: false 
            },
            { 
              name: "Resume - Run when resuming a session (e.g., restore environment)", 
              value: "resume",
              checked: true 
            },
            { 
              name: "None - Only run when manually executed", 
              value: "none",
              checked: false 
            },
          ],
          validate: (input: string[]) => input.length > 0 ? true : "At least one lifecycle event must be selected",
        },
      ]);

      // Ask about terminal close behavior
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

      script = {
        id: randomUUID(),
        name: answers.name.trim(),
        rootPath: answers.rootPath.trim(),
        script: scriptAnswer.script.trim(),
        lifecycle: lifecycleAnswer.lifecycle,
        executionMode: 'new-terminals', // Default to new-terminals
        closeTerminalAfterExecution: closeAnswer.closeTerminalAfterExecution,
      };
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

      // Ask about lifecycle events
      const lifecycleAnswer = await inquirer.customPrompt([
        {
          name: "lifecycle",
          message: "When should this script be executed?",
          type: "checkbox",
          choices: [
            { 
              name: "Open - Run when opening a project (e.g., start dev servers)", 
              value: "open",
              checked: false 
            },
            { 
              name: "Resume - Run when resuming a session (e.g., restore environment)", 
              value: "resume",
              checked: false 
            },
            { 
              name: "None - Only run when manually executed", 
              value: "none",
              checked: true 
            },
          ],
          validate: (input: string[]) => input.length > 0 ? true : "At least one lifecycle event must be selected",
        },
      ]);

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

      script = {
        id: randomUUID(),
        name: answers.name.trim(),
        rootPath: answers.rootPath.trim(),
        commands: commands,
        lifecycle: lifecycleAnswer.lifecycle,
        executionMode: 'new-terminals', // Default to new-terminals
        closeTerminalAfterExecution: closeAnswer.closeTerminalAfterExecution,
      };
    }

    // Save the script immediately
    logger.plainLog(`\n💾 Saving script: ${script.name}`);
    const result = await createScriptCommand(script);
    
    if (result.ok) {
      logger.log(`Script '${script.name}' created successfully!`);
    } else {
      logger.error(`Failed to create script '${script.name}'`);
      // Ask if user wants to continue despite the error
      const continueDespiteError = await inquirer.customPrompt([
        {
          name: "continue",
          message: "Continue creating more scripts?",
          type: "confirm",
          default: false,
        },
      ]);
      if (!continueDespiteError.continue) {
        break;
      }
    }

    // Ask if user wants to create another script
    const addAnotherAnswer = await inquirer.customPrompt([
      {
        name: "addAnother",
        message: "Create another script?",
        type: "confirm",
        default: true,
      },
    ]);

    continueAdding = addAnotherAnswer.addAnother;
    
    if (continueAdding) {
      logger.plainLog("\n" + "─".repeat(50) + "\n");
    }
  }

  logger.plainLog("\n✨ Script creation completed!");
}
