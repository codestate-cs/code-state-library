import inquirer from "@codestate/cli-interface/utils/inquirer";
import { CreateTerminalCollection, GetScripts, CreateScript, ConfigurableLogger, isSuccess, isFailure, Script, ScriptCommand } from "@codestate/core";
import { randomUUID } from "crypto";
import { CLISpinner } from "../../utils/CLISpinner";

export async function createTerminalCollectionTui() {
  await createTerminalCollectionInteractively();
}

async function createTerminalCollectionInteractively() {
  const logger = new ConfigurableLogger();
  const createTerminalCollection = new CreateTerminalCollection();
  const getScripts = new GetScripts();
  const createScript = new CreateScript();

  try {
    logger.plainLog('🚀 Creating a new terminal collection');
    logger.plainLog('');

    // Get current working directory as default rootPath
    const currentRootPath = process.cwd();
    
    // Prompt for terminal collection details
    const terminalCollectionDetails = await promptForTerminalCollectionDetails(currentRootPath);
    
    // Get existing scripts for selection
    const existingScriptsResult = await getScripts.execute();
    if (isFailure(existingScriptsResult)) {
      logger.error('Failed to get existing scripts');
      process.exit(1);
    }
    
    let availableScripts = existingScriptsResult.value;
    
    // Handle script selection with dynamic script creation
    let finalScriptSelection = false;
    const selectedScripts: Array<{ id: string; rootPath: string }> = [];
    
    let preSelectedScriptIds: string[] = [];  // Changed from preSelectedScriptNames
    
    while (!finalScriptSelection) {
      const { selectedScriptIds, shouldAddNewScript } = await promptForScriptSelectionWithAdd(availableScripts, preSelectedScriptIds);
      
      if (shouldAddNewScript) {
        // Create new script
        const newScriptDetails = await promptForNewScript();
        
        const scriptSpinner = new CLISpinner();
        scriptSpinner.start("📜 Creating script...");
        
        const scriptResult = await createScript.execute(newScriptDetails);
        if (isFailure(scriptResult)) {
          scriptSpinner.fail("Failed to create script");
          logger.error('Failed to create script');
          process.exit(1);
        }
        
        scriptSpinner.succeed("Script created successfully!");
        
        // Add the new script to available scripts
        const newScript = {
          id: randomUUID(),
          name: newScriptDetails.name,
          rootPath: newScriptDetails.rootPath,
          script: newScriptDetails.script,
          commands: newScriptDetails.commands,
          executionMode: newScriptDetails.executionMode,
          closeTerminalAfterExecution: newScriptDetails.closeTerminalAfterExecution
        } as Script;
        availableScripts.push(newScript);
        
        logger.plainLog(`Script '${newScriptDetails.name}' created successfully!`);
        logger.plainLog('');
        
        // Add the newly created script to pre-selected list along with any previously selected scripts
        preSelectedScriptIds = [...selectedScriptIds, newScript.id];  // Use newScript.id instead of newScriptDetails.name
        
        // Continue the loop to show updated script list with new script pre-selected
      } else {
        // User made their final selection
        selectedScripts.length = 0; // Clear previous selections
        for (const scriptId of selectedScriptIds) {
          const script = availableScripts.find(s => s.id === scriptId);
          if (script) {
            selectedScripts.push({ id: script.id, rootPath: script.rootPath });
          }
        }
        finalScriptSelection = true;
      }
    }
    
    // Create the terminal collection
    const terminalCollection = {
      id: randomUUID(),
      name: terminalCollectionDetails.name,
      rootPath: terminalCollectionDetails.rootPath,
      lifecycle: terminalCollectionDetails.lifecycle,
      scriptReferences: selectedScripts,
      closeTerminalAfterExecution: terminalCollectionDetails.closeTerminalAfterExecution
    };
    
    const spinner = new CLISpinner();
    spinner.start("🚀 Creating terminal collection...");
    
    const result = await createTerminalCollection.execute(terminalCollection);
    
    if (isFailure(result)) {
      spinner.fail("Failed to create terminal collection");
      logger.error('Failed to create terminal collection');
      process.exit(1);
    }
    
    spinner.succeed("Terminal collection created successfully!");
    
    logger.plainLog('');
    logger.plainLog('Terminal collection created successfully!');
    logger.plainLog('');
    logger.plainLog(`📁 Name: ${terminalCollection.name}`);
    logger.plainLog(`📍 Path: ${terminalCollection.rootPath}`);
    logger.plainLog(`🔄 Lifecycle: ${terminalCollection.lifecycle.join(', ')}`);
    logger.plainLog(`📜 Scripts: ${selectedScripts.length}`);
    logger.plainLog(`🔒 Terminal close behavior: ${terminalCollection.closeTerminalAfterExecution ? 'Auto-close' : 'Keep open'}`);
    logger.plainLog('');
    logger.plainLog('💡 You can now:');
    logger.plainLog('   • Use `codestate terminals show <name>` to view details');
    logger.plainLog('   • Use `codestate terminals resume <name>` to execute');
    logger.plainLog('   • Use `codestate terminals list` to see all collections');
    
  } catch (error) {
    logger.error('Failed to create terminal collection');
    process.exit(1);
  }
}

async function promptForTerminalCollectionDetails(currentRootPath: string) {
  const answers = await inquirer.customPrompt([
    {
      name: "name",
      message: "Terminal collection name:",
      type: "input",
      validate: (input: string) =>
        input.trim() ? true : "Terminal collection name is required",
    },
    {
      name: "rootPath",
      message: `Root path (current: ${currentRootPath}):`,
      type: "input",
      default: currentRootPath,
      validate: (input: string) =>
        input.trim() ? true : "Root path is required",
    },
    {
      name: "lifecycle",
      message: "Lifecycle events (use SPACE to select, ENTER to confirm):",
      type: "checkbox",
      choices: [
        { name: "Open (when project opens)", value: "open" },
        { name: "Resume (when session resumes)", value: "resume" },
        { name: "None (manual execution only)", value: "none" },
      ],
      validate: (input: string[]) =>
        input.length > 0 ? true : "At least one lifecycle event is required",
    },
    {
      name: "closeTerminalAfterExecution",
      message: "Should terminals close automatically after execution?",
      type: "confirm",
      default: false,
    },
  ]);

  return {
    name: answers.name.trim(),
    rootPath: answers.rootPath.trim(),
    lifecycle: answers.lifecycle,
    closeTerminalAfterExecution: answers.closeTerminalAfterExecution,
  };
}

async function promptForScriptSelectionWithAdd(availableScripts: Script[], preSelectedScripts: string[] = []) {
  // Group scripts by rootPath for better organization
  const scriptsByRootPath = availableScripts.reduce((groups, script) => {
    if (!groups[script.rootPath]) {
      groups[script.rootPath] = [];
    }
    groups[script.rootPath].push(script);
    return groups;
  }, {} as Record<string, Script[]>);

  // Display available scripts grouped by root path
  const logger = new ConfigurableLogger();
  logger.plainLog('📜 Available scripts:');
  logger.plainLog('');
  
  for (const [rootPath, scripts] of Object.entries(scriptsByRootPath)) {
    logger.plainLog(`📍 ${rootPath}:`);
    for (const script of scripts) {
      const commandCount = script.commands ? script.commands.length : (script.script ? 1 : 0);
      logger.plainLog(`   • ${script.name} (${commandCount} command${commandCount !== 1 ? 's' : ''})`);
    }
    logger.plainLog('');
  }

  // Create choices with scripts and the "Add new script" option
  // Use script.id as value instead of script.name for proper ID references
  const scriptChoices: Array<{ name: string; value: string }> = [];
  
  for (const [rootPath, scripts] of Object.entries(scriptsByRootPath)) {
    // Add scripts for this root path with clear grouping
    for (const script of scripts) {
      const commandCount = script.commands ? script.commands.length : (script.script ? 1 : 0);
      scriptChoices.push({
        name: `📍 ${rootPath} • ${script.name} (${commandCount} command${commandCount !== 1 ? 's' : ''})`,
        value: script.id  // Use script.id instead of script.name
      });
    }
  }
  
  // Add the "Add new script" option at the bottom
  scriptChoices.push({
    name: '➕ Add a new script',
    value: '__ADD_NEW_SCRIPT__'
  });

  const answers = await inquirer.customPrompt([
    {
      name: "selectedScriptIds",  // Changed from selectedScriptNames to selectedScriptIds
      message: "Select scripts to include (use SPACE to select, ENTER to confirm):",
      type: "checkbox",
      choices: scriptChoices,
      default: preSelectedScripts,
      validate: (input: string[]) => {
        // Allow selection of scripts or just the "Add new script" option
        if (input.length === 0) {
          return "Please select at least one script or choose to add a new script";
        }
        return true;
      },
    },
  ]);

  // Separate actual script selections from the "Add new script" flag
  // Now working with script IDs instead of names
  const selectedScriptIds = answers.selectedScriptIds.filter((id: string) => id !== '__ADD_NEW_SCRIPT__');
  const shouldAddNewScript = answers.selectedScriptIds.includes('__ADD_NEW_SCRIPT__');

  return {
    selectedScriptIds,  // Changed from selectedScriptNames
    shouldAddNewScript
  };
}



async function promptForNewScript() {
  const currentPath = process.cwd();
  
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

    // Get execution mode and terminal close behavior
    const configAnswers = await inquirer.customPrompt([
      {
        name: "executionMode",
        message: "How should this script be executed?",
        type: "list",
        choices: [
          { name: "Same terminal (run commands sequentially)", value: "same-terminal" },
          { name: "New terminal (open new terminal window)", value: "new-terminals" },
        ],
        default: "same-terminal",
      },
    ]);

    let closeTerminalAfterExecution = false;
    if (configAnswers.executionMode === "new-terminals") {
      const closeAnswer = await inquirer.customPrompt([
        {
          name: "closeTerminalAfterExecution",
          message: "Should the terminal close automatically after execution?",
          type: "confirm",
          default: false,
        },
      ]);
      closeTerminalAfterExecution = closeAnswer.closeTerminalAfterExecution;
    }

    return {
      id: randomUUID(),
      name: answers.name.trim(),
      rootPath: answers.rootPath.trim(),
      script: scriptAnswer.script.trim(),
      executionMode: configAnswers.executionMode,
      closeTerminalAfterExecution,
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

    // Get execution mode and terminal close behavior for multi-command scripts
    const configAnswers = await inquirer.customPrompt([
      {
        name: "executionMode",
        message: "How should this script be executed?",
        type: "list",
        choices: [
          { name: "Same terminal (run commands sequentially)", value: "same-terminal" },
          { name: "New terminal (open new terminal window)", value: "new-terminals" },
        ],
        default: "same-terminal",
      },
    ]);

    let closeTerminalAfterExecution = false;
    if (configAnswers.executionMode === "new-terminals") {
      const closeAnswer = await inquirer.customPrompt([
        {
          name: "closeTerminalAfterExecution",
          message: "Should the terminal close automatically after execution?",
          type: "confirm",
          default: false,
        },
      ]);
      closeTerminalAfterExecution = closeAnswer.closeTerminalAfterExecution;
    }

    return {
      id: randomUUID(),
      name: answers.name.trim(),
      rootPath: answers.rootPath.trim(),
      commands: commands,
      executionMode: configAnswers.executionMode,
      closeTerminalAfterExecution,
    };
  }
}

async function promptForAddAnotherScript() {
  const answers = await inquirer.customPrompt([
    {
      name: "addAnother",
      message: "Add another script to this terminal collection?",
      type: "confirm",
      default: true,
    },
  ]);

  return answers;
}
