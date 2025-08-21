import inquirer from "@codestate/cli-interface/utils/inquirer";
import { CreateTerminalCollection, GetScripts, CreateScript, ConfigurableLogger, isSuccess, isFailure, Script, ScriptCommand } from "@codestate/core";

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
      logger.error('Failed to get existing scripts', { error: existingScriptsResult.error });
      process.exit(1);
    }
    
    const existingScripts = existingScriptsResult.value;
    const selectedScripts: Array<{ id: string; rootPath: string }> = [];
    
    // Ask user if they want to select existing scripts or create new ones
    const { action } = await promptForScriptSelection(existingScripts);
    
    if (action === 'select' && existingScripts.length > 0) {
      // Select from existing scripts
      const { selectedScriptNames } = await promptForExistingScriptSelection(existingScripts);
      
      for (const scriptName of selectedScriptNames) {
        const script = existingScripts.find(s => s.name === scriptName);
        if (script) {
          selectedScripts.push({ id: script.name, rootPath: script.rootPath });
        }
      }
    } else if (action === 'create' || existingScripts.length === 0) {
      // Create new scripts
      let continueCreating = true;
      while (continueCreating) {
        const newScriptDetails = await promptForNewScript();
        
        const scriptResult = await createScript.execute(newScriptDetails);
        if (isFailure(scriptResult)) {
          logger.error('Failed to create script', { error: scriptResult.error });
          process.exit(1);
        }
        
        selectedScripts.push({ id: newScriptDetails.name, rootPath: newScriptDetails.rootPath });
        
        const { addAnother } = await promptForAddAnotherScript();
        continueCreating = addAnother;
      }
    }
    
    // Create the terminal collection
    const terminalCollection = {
      name: terminalCollectionDetails.name,
      rootPath: terminalCollectionDetails.rootPath,
      lifecycle: terminalCollectionDetails.lifecycle,
      scriptReferences: selectedScripts
    };
    
    const result = await createTerminalCollection.execute(terminalCollection);
    
    if (isFailure(result)) {
      logger.error('Failed to create terminal collection', { error: result.error });
      process.exit(1);
    }
    
    logger.plainLog('');
    logger.plainLog('✅ Terminal collection created successfully!');
    logger.plainLog('');
    logger.plainLog(`📁 Name: ${terminalCollection.name}`);
    logger.plainLog(`📍 Path: ${terminalCollection.rootPath}`);
    logger.plainLog(`🔄 Lifecycle: ${terminalCollection.lifecycle.join(', ')}`);
    logger.plainLog(`📜 Scripts: ${selectedScripts.length}`);
    logger.plainLog('');
    logger.plainLog('💡 You can now:');
    logger.plainLog('   • Use `codestate terminals show <name>` to view details');
    logger.plainLog('   • Use `codestate terminals resume <name>` to execute');
    logger.plainLog('   • Use `codestate terminals list` to see all collections');
    
  } catch (error) {
    logger.error('Failed to create terminal collection', { error });
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
  ]);

  return {
    name: answers.name.trim(),
    rootPath: answers.rootPath.trim(),
    lifecycle: answers.lifecycle,
  };
}

async function promptForScriptSelection(existingScripts: Script[]) {
  if (existingScripts.length === 0) {
    return { action: 'create' };
  }

  // Group scripts by rootPath
  const scriptsByRootPath = existingScripts.reduce((groups, script) => {
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

  const choices = [
    { name: "Select from existing scripts", value: "select" },
    { name: "Create new scripts", value: "create" },
  ];

  const answers = await inquirer.customPrompt([
    {
      name: "action",
      message: "How would you like to add scripts to this terminal collection?",
      type: "list",
      choices: choices,
    },
  ]);

  return answers;
}

async function promptForExistingScriptSelection(existingScripts: Script[]) {
  // Group scripts by rootPath for better organization
  const scriptsByRootPath = existingScripts.reduce((groups, script) => {
    if (!groups[script.rootPath]) {
      groups[script.rootPath] = [];
    }
    groups[script.rootPath].push(script);
    return groups;
  }, {} as Record<string, Script[]>);

  // Create choices with separators and grouped scripts
  const scriptChoices: Array<{ name: string; value: string; type?: string }> = [];
  
  for (const [rootPath, scripts] of Object.entries(scriptsByRootPath)) {
    // Add separator for root path
    scriptChoices.push({
      name: `📍 ${rootPath}`,
      value: `separator-${rootPath}`,
      type: 'separator'
    });
    
    // Add scripts for this root path
    for (const script of scripts) {
      const commandCount = script.commands ? script.commands.length : (script.script ? 1 : 0);
      scriptChoices.push({
        name: `   • ${script.name} (${commandCount} command${commandCount !== 1 ? 's' : ''})`,
        value: script.name,
      });
    }
    
    // Add empty line separator
    scriptChoices.push({
      name: '',
      value: `empty-${rootPath}`,
      type: 'separator'
    });
  }

  const answers = await inquirer.customPrompt([
    {
      name: "selectedScriptNames",
      message: "Select scripts to add (use SPACE to select, ENTER to confirm):",
      type: "checkbox",
      choices: scriptChoices,
      validate: (input: string[]) => {
        // Filter out separator values
        const actualSelections = input.filter(choice => !choice.startsWith('separator-') && !choice.startsWith('empty-'));
        return actualSelections.length > 0 ? true : "At least one script must be selected";
      },
    },
  ]);

  // Filter out separator values from the result
  const filteredSelections = answers.selectedScriptNames.filter(
    (choice: string) => !choice.startsWith('separator-') && !choice.startsWith('empty-')
  );

  return { selectedScriptNames: filteredSelections };
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

    return {
      name: answers.name.trim(),
      rootPath: answers.rootPath.trim(),
      script: scriptAnswer.script.trim(),
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

    return {
      name: answers.name.trim(),
      rootPath: answers.rootPath.trim(),
      commands: commands,
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
