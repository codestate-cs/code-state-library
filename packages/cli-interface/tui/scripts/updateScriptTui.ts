import inquirer from "@codestate/cli-interface/utils/inquirer";
import { Script, ScriptCommand, GetScripts, ConfigurableLogger } from "@codestate/core";
import { updateScriptCommand } from "../../commands/scripts/updateScript";

export async function updateScriptTui() {
  const logger = new ConfigurableLogger();
  const getScripts = new GetScripts();
  
  try {
    // Phase 1: Interactive Script Selection
    logger.plainLog("📝 Select a script to update:");
    
    const scriptsResult = await getScripts.execute();
    if (!scriptsResult.ok || scriptsResult.value.length === 0) {
      logger.warn("No scripts found to update.");
      return;
    }
    
    const scripts = scriptsResult.value;
    const { selectedScriptId } = await inquirer.customPrompt([
      {
        type: "list",
        name: "selectedScriptId",
        message: "Choose a script to update:",
        choices: scripts.map((script) => ({
          name: `${script.name} (${script.rootPath})`,
          value: script.id,
        })),
      },
    ]);
    
    const selectedScript = scripts.find(s => s.id === selectedScriptId);
    if (!selectedScript) {
      logger.error("Selected script not found.");
      return;
    }
    
    // Phase 2: Show Current Script Details
    logger.plainLog(`\n📋 Current Script: ${selectedScript.name}`);
    logger.plainLog(`📍 Path: ${selectedScript.rootPath}`);
    logger.plainLog(`🔧 Type: ${selectedScript.script ? 'Single Command' : 'Multi-Command'}`);
    
    if (selectedScript.script) {
      logger.plainLog(`💻 Command: ${selectedScript.script}`);
    } else if (selectedScript.commands && selectedScript.commands.length > 0) {
      logger.plainLog(`💻 Commands:`);
      selectedScript.commands
        .sort((a, b) => a.priority - b.priority)
        .forEach((cmd) => {
          logger.plainLog(`  ${cmd.priority}. ${cmd.name} - ${cmd.command}`);
        });
    }
    
    const executionMode = (selectedScript as any).executionMode || 'same-terminal';
    const closeAfterExecution = (selectedScript as any).closeTerminalAfterExecution || false;
    logger.plainLog(`🚀 Execution: ${executionMode} ${executionMode === 'new-terminals' ? (closeAfterExecution ? '(auto-close)' : '(keep open)') : ''}`);
    
    // Phase 3: Choose Update Strategy
    const { updateStrategy } = await inquirer.customPrompt([
      {
        type: "list",
        name: "updateStrategy",
        message: "What would you like to update?",
        choices: [
          { name: "Basic properties (name, path)", value: "basic" },
          { name: "Manage commands (modify/add/delete)", value: "commands" },
          { name: "Replace entire script", value: "replace" }
        ]
      }
    ]);
    
    const scriptUpdate: Partial<Script> = {};
    
    if (updateStrategy === "basic") {
      // Phase 4: Update Basic Properties
      await updateBasicProperties(selectedScript, scriptUpdate);
    } else if (updateStrategy === "commands") {
      // Phase 5: Manage Commands
      await manageCommands(selectedScript, scriptUpdate);
    } else if (updateStrategy === "replace") {
      // Phase 6: Replace Entire Script
      await replaceEntireScript(selectedScript, scriptUpdate);
    }
    
    // Phase 7: Preview Changes
    if (Object.keys(scriptUpdate).length === 0) {
      logger.plainLog("\n✨ No changes to apply.");
      return;
    }
    
    logger.plainLog("\n🔍 Changes to be made:");
    Object.entries(scriptUpdate).forEach(([field, value]) => {
      if (field === 'commands') {
        logger.plainLog(`  • ${field}: ${selectedScript.commands?.length || 0} → ${(value as any[]).length} commands`);
      } else {
        logger.plainLog(`  • ${field}: ${selectedScript[field as keyof Script]} → ${value}`);
      }
    });
    
    // Phase 8: Confirm Changes
    const { confirm } = await inquirer.customPrompt([
      {
        name: "confirm",
        message: "\nApply these changes?",
        type: "confirm",
        default: false
      }
    ]);
    
    if (!confirm) {
      logger.plainLog("Update cancelled.");
      return;
    }
    
    // Phase 9: Apply Changes
    logger.plainLog("\n💾 Applying changes...");
    const result = await updateScriptCommand(selectedScript.id, scriptUpdate);
    
    if (result.ok) {
      // Success message is already logged by updateScriptCommand
      logger.plainLog("✨ Update completed successfully!");
    } else {
      logger.error("Failed to update script");
      
      // Phase 10: Error Recovery
      const { retry } = await inquirer.customPrompt([
        {
          name: "retry",
          message: "Would you like to try updating with different values?",
          type: "confirm",
          default: false
        }
      ]);
      
      if (retry) {
        await updateScriptTui(); // Recursive call to retry
      }
    }
    
  } catch (error) {
    logger.error("Unexpected error during script update");
  }
}

async function updateBasicProperties(script: Script, scriptUpdate: Partial<Script>) {
  const { updateFields } = await inquirer.customPrompt([
    {
      type: "checkbox",
      name: "updateFields",
      message: "Select fields to update:",
      choices: [
        { name: `Script name (current: ${script.name})`, value: "name" },
        { name: `Root path (current: ${script.rootPath})`, value: "rootPath" },
        { name: `Terminal close behavior (current: ${(script as any).closeTerminalAfterExecution ? 'auto-close' : 'keep open'})`, value: "closeTerminalAfterExecution" }
      ]
    }
  ]);
  
  for (const field of updateFields) {
    if (field === "name") {
      const { newName } = await inquirer.customPrompt([
    {
      name: "newName",
          message: `Script name (current: ${script.name}):`,
          type: "input",
          default: script.name
        }
      ]);
      if (newName.trim() && newName.trim() !== script.name) {
        scriptUpdate.name = newName.trim();
      }
    } else if (field === "rootPath") {
      const { newRootPath } = await inquirer.customPrompt([
        {
          name: "newRootPath",
          message: `Root path (current: ${script.rootPath}):`,
      type: "input",
          default: script.rootPath
        }
      ]);
      if (newRootPath.trim() && newRootPath.trim() !== script.rootPath) {
        scriptUpdate.rootPath = newRootPath.trim();
      }
    } else if (field === "closeTerminalAfterExecution") {
      const { newCloseBehavior } = await inquirer.customPrompt([
        {
          type: "list",
          name: "newCloseBehavior",
          message: `Terminal close behavior (current: ${(script as any).closeTerminalAfterExecution ? 'auto-close' : 'keep open'}):`,
          choices: [
            { name: "Keep terminal open (useful for debugging)", value: false },
            { name: "Close terminal automatically", value: true }
          ],
          default: (script as any).closeTerminalAfterExecution || false
        }
      ]);
      scriptUpdate.closeTerminalAfterExecution = newCloseBehavior;
    }
  }
}

async function manageCommands(script: Script, scriptUpdate: Partial<Script>) {
  if (!script.commands || script.commands.length === 0) {
    // No existing commands, just add new ones
    const newCommands = await createNewCommands();
    scriptUpdate.commands = newCommands;
    return;
  }
  
  const { commandAction } = await inquirer.customPrompt([
    {
      type: "list",
      name: "commandAction",
      message: "What would you like to do with commands?",
      choices: [
        { name: "Keep all commands unchanged", value: "keep" },
        { name: "Modify existing commands", value: "modify" },
        { name: "Delete specific commands", value: "delete" },
        { name: "Add new commands", value: "add" },
        { name: "Replace all commands", value: "replace" }
      ]
    }
  ]);
  
  if (commandAction === "keep") {
    return; // No changes
  } else if (commandAction === "modify") {
    const updatedCommands = await modifyExistingCommands(script.commands);
    scriptUpdate.commands = updatedCommands;
  } else if (commandAction === "delete") {
    const updatedCommands = await deleteSpecificCommands(script.commands);
    scriptUpdate.commands = updatedCommands;
  } else if (commandAction === "add") {
    const newCommands = await createNewCommands();
    scriptUpdate.commands = [...script.commands, ...newCommands];
  } else if (commandAction === "replace") {
    const newCommands = await createNewCommands();
    scriptUpdate.commands = newCommands;
  }
}

async function modifyExistingCommands(commands: ScriptCommand[]): Promise<ScriptCommand[]> {
  const updatedCommands = [...commands];
  
  while (true) {
    const { commandToModify } = await inquirer.customPrompt([
      {
        type: "list",
        name: "commandToModify",
        message: "Select command to modify (or 'Done' to finish):",
        choices: [
          ...commands.map((cmd, index) => ({
            name: `${index + 1}. ${cmd.name} - ${cmd.command}`,
            value: index
          })),
          { name: "Done modifying", value: "done" }
        ]
      }
    ]);
    
    if (commandToModify === "done") break;
    
    const selectedCommand = commands[commandToModify];
    const { newCommandName, newCommand } = await inquirer.customPrompt([
      {
        name: "newCommandName",
        message: `Command name (current: ${selectedCommand.name}):`,
        type: "input",
        default: selectedCommand.name
      },
      {
        name: "newCommand",
        message: `Command (current: ${selectedCommand.command}):`,
        type: "input",
        default: selectedCommand.command
      }
    ]);
    
    updatedCommands[commandToModify] = {
      ...selectedCommand,
      name: newCommandName.trim() || selectedCommand.name,
      command: newCommand.trim() || selectedCommand.command
    };
  }
  
  return updatedCommands;
}

async function deleteSpecificCommands(commands: ScriptCommand[]): Promise<ScriptCommand[]> {
  const { commandsToDelete } = await inquirer.customPrompt([
    {
      type: "checkbox",
      name: "commandsToDelete",
      message: "Select commands to delete:",
      choices: commands.map((cmd, index) => ({
        name: `${index + 1}. ${cmd.name} - ${cmd.command}`,
        value: index,
        checked: false
      }))
    }
  ]);
  
  return commands.filter((_, index) => !commandsToDelete.includes(index));
}

async function createNewCommands(): Promise<ScriptCommand[]> {
  const commands: ScriptCommand[] = [];
  let continueAdding = true;
    let commandPriority = 1;

  while (continueAdding) {
    const { commandName, command, addAnother } = await inquirer.customPrompt([
        {
          name: "commandName",
        message: `Command name (priority ${commandPriority}):`,
          type: "input",
        validate: (input: string) => input.trim() ? true : "Command name required"
        },
        {
          name: "command",
        message: `Command (priority ${commandPriority}):`,
          type: "input",
        validate: (input: string) => input.trim() ? true : "Command required"
        },
        {
        name: "addAnother",
          message: "Add another command?",
          type: "confirm",
        default: true
      }
      ]);

      commands.push({
      name: commandName.trim(),
      command: command.trim(),
      priority: commandPriority
      });

      commandPriority++;
    continueAdding = addAnother;
  }
  
  return commands;
}

async function replaceEntireScript(script: Script, scriptUpdate: Partial<Script>) {
  const { scriptType } = await inquirer.customPrompt([
    {
      name: "scriptType",
      message: "New script type:",
      type: "list",
      choices: [
        { name: "Single command (legacy)", value: "single" },
        { name: "Multiple commands with priority", value: "multiple" }
      ]
    }
  ]);
  
  if (scriptType === "single") {
    const { newScript } = await inquirer.customPrompt([
      {
        name: "newScript",
        message: "New script command:",
        type: "input",
        validate: (input: string) => input.trim() ? true : "Script command required"
      }
    ]);
    
    scriptUpdate.script = newScript.trim();
    scriptUpdate.commands = undefined; // Remove multi-command structure
  } else {
    const newCommands = await createNewCommands();
    scriptUpdate.commands = newCommands;
    scriptUpdate.script = undefined; // Remove single command
  }
  
  // Default to new terminal execution (no user choice needed)
  scriptUpdate.executionMode = 'new-terminals';
  scriptUpdate.closeTerminalAfterExecution = false;
}
