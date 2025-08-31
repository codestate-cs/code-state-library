import inquirer from "inquirer";
import { ConfigurableLogger, TerminalCollectionFacade } from "@codestate/core";
import { deleteTerminalCollectionCommand } from "../../commands/terminals/deleteTerminalCollection";

export async function deleteTerminalCollectionTui() {
  const logger = new ConfigurableLogger();
  const terminalCollectionService = new TerminalCollectionFacade();

  try {
    // Get all terminal collections
    const result = await terminalCollectionService.getTerminalCollections({ loadScripts: true });
    if (!result.ok) {
      logger.error("Failed to get terminal collections");
      return;
    }

    const terminalCollections = result.value;
    if (terminalCollections.length === 0) {
      logger.log("📝 No terminal collections found to delete.");
      return;
    }

    // Create choices for inquirer
    const choices = terminalCollections.map((tc: any) => ({
      name: `${tc.name} (${tc.rootPath}) - ID: ${tc.id}`,
      value: tc.id
    }));

    // Add a cancel option
    choices.push({
      name: "Cancel",
      value: null
    });

    const answers = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedTerminalCollections",
        message: "Select terminal collections to delete (use spacebar to select/deselect):",
        choices,
        pageSize: 10,
        validate: (input: string[]) => {
          if (input.length === 0) {
            return 'Please select at least one terminal collection';
          }
          return true;
        }
      }
    ]);

    if (answers.selectedTerminalCollections && answers.selectedTerminalCollections.length > 0) {
      // Filter out null values (cancel option)
      const selectedIds = answers.selectedTerminalCollections.filter((id: string) => id !== null);
      
      if (selectedIds.length === 0) {
        logger.log("Operation cancelled.");
        return;
      }

      // Show confirmation
      const confirmAnswer = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Are you sure you want to delete ${selectedIds.length} terminal collection(s)? This action cannot be undone.`,
          default: false
        }
      ]);

      if (confirmAnswer.confirm) {
        await deleteTerminalCollectionCommand(selectedIds);
      } else {
        logger.log("Operation cancelled.");
      }
    } else {
      logger.log("Operation cancelled.");
    }
  } catch (error) {
    logger.error("An error occurred during terminal collection deletion");
  }
} 