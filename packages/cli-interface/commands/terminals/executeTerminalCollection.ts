import { ConfigurableLogger, TerminalCollectionFacade, TerminalCollectionWithScripts } from "@codestate/core";
import inquirer from "../../utils/inquirer";
import { CLISpinner } from "../../utils/CLISpinner";

const getName = (tc: TerminalCollectionWithScripts) => {
  return `${tc.name} (${tc.rootPath}) \n  Scripts:\n   ${tc.scripts?.map((s) => `Name: ${s.name}, Commands: ${s.commands?.length || 0}`).join("\n   ")}`
}

export async function executeTerminalCollectionCommand(
  terminalCollectionName?: string, 
  rootPath?: string, 
  lifecycleFilter?: string[]
) {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const terminalCollectionService = new TerminalCollectionFacade();

  try {
    let targetTerminalCollectionName = terminalCollectionName;
    let targetRootPath = rootPath || process.cwd();
    let selectedTerminalCollectionId: string | undefined;

    // If no terminal collection name specified, ask user to select one
    if (!targetTerminalCollectionName) {
      // Get terminal collections with filtering options
      const options: { rootPath?: string; lifecycle?: string; loadScripts?: boolean } = {
        loadScripts: true
      };
      
      if (targetRootPath && targetRootPath !== process.cwd()) {
        options.rootPath = targetRootPath;
      }
      
      if (lifecycleFilter && lifecycleFilter.length > 0) {
        options.lifecycle = lifecycleFilter[0]; // Use first filter for now
      }

      const terminalCollectionsResult = await terminalCollectionService.getTerminalCollections(options);
      if (!terminalCollectionsResult.ok || terminalCollectionsResult.value.length === 0) {
        logger.warn("No terminal collections found");
        return;
      }

      const terminalCollections = terminalCollectionsResult.value as TerminalCollectionWithScripts[];
      const { selectedTerminalCollection } = await inquirer.customPrompt([
        {
          type: "list",
          name: "selectedTerminalCollection",
          message: "Select a terminal collection to execute:",
          choices: terminalCollections.map((tc) => ({
            name: getName(tc),
            value: tc.id,
          })),
        },
      ]);
      selectedTerminalCollectionId = selectedTerminalCollection || "";
    }

    // If we have a selected ID from the list, use it directly
    if (selectedTerminalCollectionId) {
      const result = await terminalCollectionService.executeTerminalCollectionById(selectedTerminalCollectionId);
      
      if (result.ok) {
        spinner.succeed("Terminal collection executed successfully");
        logger.log("Terminal collection executed successfully");
      } else {
        spinner.fail("Terminal collection execution failed");
        logger.error("Terminal collection execution failed");
        process.exit(1);
      }
      return;
    }

    // Ensure targetTerminalCollectionName is not empty
    if (!targetTerminalCollectionName || !targetTerminalCollectionName.trim()) {
      logger.plainLog("No terminal collection specified. Execution cancelled.");
      return;
    }

    // Get all terminal collections to find matching ones
    const allTerminalCollectionsResult = await terminalCollectionService.getTerminalCollections({ loadScripts: true });
    if (!allTerminalCollectionsResult.ok) {
      logger.error("Failed to get terminal collections");
      return;
    }

    // Find all terminal collections that match the target name (case-insensitive)
    const matchingTerminalCollections = allTerminalCollectionsResult.value.filter((tc: any) => 
      tc.name.toLowerCase().includes(targetTerminalCollectionName.toLowerCase())
    ) as TerminalCollectionWithScripts[];

    if (matchingTerminalCollections.length === 0) {
      logger.error(`No terminal collections found matching '${targetTerminalCollectionName}'`);
      return;
    }

    let targetTerminalCollection: TerminalCollectionWithScripts;

    // If multiple terminal collections match, let user choose
    if (matchingTerminalCollections.length > 1) {
      logger.plainLog(`Found ${matchingTerminalCollections.length} terminal collections matching '${targetTerminalCollectionName}':`);
      
      const { selectedTerminalCollection } = await inquirer.customPrompt([
        {
          type: "list",
          name: "selectedTerminalCollection",
          message: "Select a terminal collection to execute:",
          choices: matchingTerminalCollections.map((tc) => ({
            name: getName(tc),
            value: tc.id,
          })),
        },
      ]);

      const foundTerminalCollection = matchingTerminalCollections.find(tc => tc.id === selectedTerminalCollection);
      if (!foundTerminalCollection) {
        logger.plainLog("No terminal collection selected. Execution cancelled.");
        return;
      }
      targetTerminalCollection = foundTerminalCollection;
    } else {
      // Only one terminal collection matches
      targetTerminalCollection = matchingTerminalCollections[0];
    }

    logger.plainLog(`🚀 Executing terminal collection: "${targetTerminalCollection.name}" from ${targetTerminalCollection.rootPath}`);
    logger.plainLog(`📍 Path: ${targetRootPath}`);
    logger.plainLog('');
    
    spinner.start("⚡ Executing terminal collection...");

    // Use the service to execute the terminal collection
    const result = await terminalCollectionService.executeTerminalCollectionById(targetTerminalCollection.id);
    
    if (result.ok) {
      spinner.succeed("Terminal collection executed successfully");
      logger.log("Terminal collection executed successfully");
    } else {
      spinner.fail("Terminal collection execution failed");
      // Check if it's a "not found" error and provide a user-friendly message
      if ('code' in result.error && result.error.code === 'STORAGE_READ_FAILED') {
        logger.plainLog(`Terminal collection '${targetTerminalCollection.name}' not found in the current directory.`);
        logger.plainLog('');
        logger.plainLog(`Current directory: ${targetRootPath}`);
        logger.plainLog('');
        logger.plainLog('💡 Try these options:');
        logger.plainLog('   • Use `codestate terminals list` to see available terminal collections');
        logger.plainLog('   • Make sure you\'re in the correct project directory');
        logger.plainLog('   • Create a new terminal collection with `codestate terminals create`');
      } else {
        logger.error("Terminal collection execution failed");
      }
      process.exit(1);
    }

  } catch (error) {
    logger.error("Unexpected error during terminal collection execution");
  }
}
