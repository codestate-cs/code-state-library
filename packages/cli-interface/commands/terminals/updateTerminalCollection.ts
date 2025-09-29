import { UpdateTerminalCollection, TerminalCollection, TerminalCollectionWithScripts, Result, Script, ScriptReference, GetTerminalCollections, GetTerminalCollectionById, GetScripts } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";
import { ConfigurableLogger } from "@codestate/core";
import inquirer from "../../utils/inquirer";

export async function updateTerminalCollectionCommand(
  terminalCollectionName?: string,
  rootPath?: string
): Promise<Result<void>> {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const updateTerminalCollection = new UpdateTerminalCollection();
  const getTerminalCollections = new GetTerminalCollections();
  const getTerminalCollectionById = new GetTerminalCollectionById();
  const getScripts = new GetScripts();

  try {
    let targetTerminalCollectionName = terminalCollectionName;
    let targetRootPath = rootPath || process.cwd();
    let selectedTerminalCollectionId: string | undefined;

    // If no terminal collection name specified, ask user to select one
    if (!targetTerminalCollectionName) {
      const terminalCollectionsResult = await getTerminalCollections.execute({
        rootPath: targetRootPath,
        loadScripts: false
      });

      if (!terminalCollectionsResult.ok || terminalCollectionsResult.value.length === 0) {
        logger.warn("No terminal collections found");
        return { ok: false, error: new Error("No terminal collections found") };
      }

      const terminalCollections = terminalCollectionsResult.value;
      const { selectedTerminalCollection } = await inquirer.customPrompt([
        {
          type: "list",
          name: "selectedTerminalCollection",
          message: "Select a terminal collection to update:",
          choices: terminalCollections.map((tc: TerminalCollectionWithScripts) => ({
            name: `${tc.name} (${tc.rootPath})`,
            value: tc.id,
          })),
        },
      ]);
      selectedTerminalCollectionId = selectedTerminalCollection || "";
    } else {
      // User provided a name, need to resolve it to ID
      const terminalCollectionsResult = await getTerminalCollections.execute({
        loadScripts: false
      });

      if (!terminalCollectionsResult.ok) {
        logger.error("Failed to fetch terminal collections");
        return { ok: false, error: terminalCollectionsResult.error };
      }

      const terminalCollections = terminalCollectionsResult.value;
      
      // Find collections with matching name
      const matchingCollections = terminalCollections.filter(
        (tc: TerminalCollectionWithScripts) => tc.name === targetTerminalCollectionName
      );

      if (matchingCollections.length === 0) {
        logger.error(`Terminal collection '${targetTerminalCollectionName}' not found`);
        return { ok: false, error: new Error(`Terminal collection '${targetTerminalCollectionName}' not found`) };
      }

      if (matchingCollections.length === 1) {
        // Single match found
        selectedTerminalCollectionId = matchingCollections[0].id;
        logger.plainLog(`Found terminal collection: ${matchingCollections[0].name} (${matchingCollections[0].rootPath})`);
      } else {
        // Multiple matches found, ask user to select
        logger.plainLog(`Found ${matchingCollections.length} terminal collections with name '${targetTerminalCollectionName}':`);
        
        const { selectedTerminalCollection } = await inquirer.customPrompt([
          {
            type: "list",
            name: "selectedTerminalCollection",
            message: "Select the terminal collection to update:",
            choices: matchingCollections.map((tc: TerminalCollectionWithScripts) => ({
              name: `${tc.name} (${tc.rootPath})`,
              value: tc.id,
            })),
          },
        ]);
        selectedTerminalCollectionId = selectedTerminalCollection || "";
      }
    }

    if (!selectedTerminalCollectionId) {
      logger.error("No terminal collection selected");
      return { ok: false, error: new Error("No terminal collection selected") };
    }

    // Get the current terminal collection to show current values
    const currentCollectionResult = await getTerminalCollectionById.execute(selectedTerminalCollectionId);
    if (!currentCollectionResult.ok) {
      logger.error("Failed to fetch terminal collection details");
      return { ok: false, error: currentCollectionResult.error };
    }

    const currentCollection = currentCollectionResult.value;
    
    // Show current values
    logger.plainLog(`\n📋 Current Terminal Collection: ${currentCollection.name}`);
    logger.plainLog(`📁 Root Path: ${currentCollection.rootPath}`);
    logger.plainLog(`🔄 Lifecycle: ${currentCollection.lifecycle.join(', ')}`);
    logger.plainLog(`📜 Script References: ${currentCollection.scriptReferences.length}`);
    logger.plainLog(`🔧 Close After Execution: ${currentCollection.closeTerminalAfterExecution ? 'Yes' : 'No'}`);
    logger.plainLog(`⚡ Execution Mode: ${currentCollection.executionMode || 'same-terminal'}`);

    // Ask what to update
    const { updateFields } = await inquirer.customPrompt([
      {
        type: "checkbox",
        name: "updateFields",
        message: "What would you like to update?",
        choices: [
          { name: "Name", value: "name" },
          { name: "Root Path", value: "rootPath" },
          { name: "Lifecycle Events", value: "lifecycle" },
          { name: "Script References", value: "scriptReferences" },
          { name: "Close After Execution", value: "closeTerminalAfterExecution" },
          { name: "Execution Mode", value: "executionMode" },
        ],
        validate: (input: string[]) => input.length > 0 ? true : "Please select at least one field to update",
      },
    ]);

    const updates: Partial<TerminalCollection> = {};

    // Collect updates for each selected field
    for (const field of updateFields) {
      switch (field) {
        case "name":
          const { name } = await inquirer.customPrompt([
            {
              name: "name",
              message: `Terminal collection name (current: ${currentCollection.name}):`,
              type: "input",
              default: currentCollection.name,
              validate: (input: string) => input.trim() ? true : "Name is required",
            },
          ]);
          updates.name = name.trim();
          break;

        case "rootPath":
          const { rootPath } = await inquirer.customPrompt([
            {
              name: "rootPath",
              message: `Root path (current: ${currentCollection.rootPath}):`,
              type: "input",
              default: currentCollection.rootPath,
              validate: (input: string) => input.trim() ? true : "Root path is required",
            },
          ]);
          updates.rootPath = rootPath.trim();
          break;

        case "lifecycle":
          const { lifecycle } = await inquirer.customPrompt([
            {
              name: "lifecycle",
              message: "When should this terminal collection be executed?",
              type: "checkbox",
              choices: [
                { 
                  name: "Open - Run when opening a project (e.g., start dev servers)", 
                  value: "open",
                  checked: currentCollection.lifecycle.includes("open")
                },
                { 
                  name: "Resume - Run when resuming a session (e.g., restore environment)", 
                  value: "resume",
                  checked: currentCollection.lifecycle.includes("resume")
                },
                { 
                  name: "None - Only run when manually executed", 
                  value: "none",
                  checked: currentCollection.lifecycle.includes("none")
                },
              ],
              validate: (input: string[]) => input.length > 0 ? true : "At least one lifecycle event must be selected",
            },
          ]);
          updates.lifecycle = lifecycle;
          break;

        case "closeTerminalAfterExecution":
          const { closeTerminalAfterExecution } = await inquirer.customPrompt([
            {
              name: "closeTerminalAfterExecution",
              message: "Should terminals close after execution?",
              type: "list",
              choices: [
                { name: "Keep terminals open (useful for debugging, manual follow-up)", value: false },
                { name: "Close terminals automatically (clean exit)", value: true },
              ],
              default: currentCollection.closeTerminalAfterExecution,
            },
          ]);
          updates.closeTerminalAfterExecution = closeTerminalAfterExecution;
          break;

        case "executionMode":
          const { executionMode } = await inquirer.customPrompt([
            {
              name: "executionMode",
              message: "How should scripts be executed?",
              type: "list",
              choices: [
                { 
                  name: "Same Terminal - Try tabs first, fallback to multiple terminals", 
                  value: "same-terminal",
                  checked: (currentCollection.executionMode || 'same-terminal') === 'same-terminal'
                },
                { 
                  name: "Multi Terminal - Each script in separate terminal", 
                  value: "multi-terminal",
                  checked: currentCollection.executionMode === 'multi-terminal'
                },
                { 
                  name: "IDE - For IDE extension use only", 
                  value: "ide",
                  checked: currentCollection.executionMode === 'ide'
                },
              ],
              default: currentCollection.executionMode || 'same-terminal',
            },
          ]);
          updates.executionMode = executionMode;
          break;

        case "scriptReferences":
          // Handle script references - fetch available scripts and allow selection
          await handleScriptReferencesUpdate(currentCollection, updates, logger, getScripts);
          break;
      }
    }

    // Show summary of changes
    logger.plainLog("\n📝 Summary of changes:");
    Object.entries(updates).forEach(([key, value]) => {
      const currentValue = (currentCollection as any)[key];
      logger.plainLog(`  ${key}: ${JSON.stringify(currentValue)} → ${JSON.stringify(value)}`);
    });

    // Confirm updates
    const { confirm } = await inquirer.customPrompt([
      {
        name: "confirm",
        message: "Do you want to apply these updates?",
        type: "confirm",
        default: true,
      },
    ]);

    if (!confirm) {
      logger.plainLog("Update cancelled.");
      return { ok: true, value: undefined };
    }

    // Apply updates
    spinner.start("Updating terminal collection...");
    
    const result = await updateTerminalCollection.execute(
      selectedTerminalCollectionId,
      updates
    );

    if (result.ok) {
      spinner.succeed(`Terminal collection '${currentCollection.name}' updated successfully`);
    } else {
      spinner.fail("Failed to update terminal collection");
    }
    
    return result;
  } catch (error) {
    spinner.fail("Unexpected error during terminal collection update");
    return { 
      ok: false, 
      error: error instanceof Error ? error : new Error('Unknown error during terminal collection update') 
    };
  }
}

async function handleScriptReferencesUpdate(
  currentCollection: TerminalCollection,
  updates: Partial<TerminalCollection>,
  logger: ConfigurableLogger,
  getScripts: GetScripts
): Promise<void> {
  // Get all available scripts
  const scriptsResult = await getScripts.execute();
  if (!scriptsResult.ok || scriptsResult.value.length === 0) {
    logger.warn("No scripts found. Keeping current script references unchanged.");
    return;
  }

  const availableScripts = scriptsResult.value;
  
  // Show current script references
  logger.plainLog(`\nCurrent script references (${currentCollection.scriptReferences.length}):`);
  currentCollection.scriptReferences.forEach((ref, index) => {
    logger.plainLog(`  ${index + 1}. ${ref.id} (${ref.rootPath})`);
  });

  // Ask what to do with script references
  const { scriptAction } = await inquirer.customPrompt([
    {
      name: "scriptAction",
      message: "What would you like to do with script references?",
      type: "list",
      choices: [
        { name: "Keep current script references unchanged", value: "keep" },
        { name: "Replace all script references", value: "replace" },
        { name: "Add new script references", value: "add" },
        { name: "Remove some script references", value: "remove" },
      ],
    },
  ]);

  let newScriptReferences: ScriptReference[] = [...currentCollection.scriptReferences];

  switch (scriptAction) {
    case "keep":
      // Do nothing, keep current references
      break;

    case "replace":
      // Replace all script references
      const { selectedScripts } = await inquirer.customPrompt([
        {
          name: "selectedScripts",
          message: "Select scripts to reference:",
          type: "checkbox",
          choices: availableScripts.map((script: Script) => ({
            name: `${script.name} (${script.rootPath})`,
            value: script.id,
          })),
        },
      ]);

      newScriptReferences = selectedScripts.map((scriptId: string) => {
        const script = availableScripts.find((s: Script) => s.id === scriptId);
        return {
          id: scriptId,
          rootPath: script?.rootPath || "",
        };
      });
      break;

    case "add":
      // Add new script references
      const availableScriptsToAdd = availableScripts.filter((script: Script) => 
        !currentCollection.scriptReferences.some(ref => ref.id === script.id)
      );
      
      if (availableScriptsToAdd.length === 0) {
        logger.plainLog("No additional scripts available to add.");
        break;
      }
      
      const { scriptsToAdd } = await inquirer.customPrompt([
        {
          name: "scriptsToAdd",
          message: "Select additional scripts to reference:",
          type: "checkbox",
          choices: availableScriptsToAdd.map((script: Script) => ({
            name: `${script.name} (${script.rootPath})`,
            value: script.id,
          })),
        },
      ]);

      scriptsToAdd.forEach((scriptId: string) => {
        const script = availableScripts.find((s: Script) => s.id === scriptId);
        if (script) {
          newScriptReferences.push({
            id: scriptId,
            rootPath: script.rootPath,
          });
        }
      });
      break;

    case "remove":
      // Remove some script references
      const { scriptsToRemove } = await inquirer.customPrompt([
        {
          name: "scriptsToRemove",
          message: "Select script references to remove:",
          type: "checkbox",
          choices: currentCollection.scriptReferences.map((ref, index) => ({
            name: `${ref.id} (${ref.rootPath})`,
            value: index,
          })),
        },
      ]);

      // Remove selected references (in reverse order to maintain indices)
      scriptsToRemove.sort((a: number, b: number) => b - a).forEach((index: number) => {
        newScriptReferences.splice(index, 1);
      });
      break;
  }

  updates.scriptReferences = newScriptReferences;
}