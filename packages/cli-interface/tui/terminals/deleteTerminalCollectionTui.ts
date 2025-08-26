import inquirer from "inquirer";
import { ConfigurableLogger, ListTerminalCollections } from "@codestate/core";
import { deleteTerminalCollectionCommand } from "../../commands/terminals/deleteTerminalCollection";

export async function deleteTerminalCollectionTui() {
  const logger = new ConfigurableLogger();
  const listTerminalCollections = new ListTerminalCollections();

  try {
    // Get all terminal collections
    const result = await listTerminalCollections.execute();
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
      name: `${tc.name} (${tc.rootPath})`,
      value: { name: tc.name, rootPath: tc.rootPath }
    }));

    // Add a cancel option
    choices.push({
      name: "Cancel",
      value: { name: null, rootPath: null }
    });

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "terminalCollection",
        message: "Select a terminal collection to delete:",
        choices,
        pageSize: 10
      },
      {
        type: "confirm",
        name: "confirm",
        message: "Are you sure you want to delete this terminal collection? This action cannot be undone.",
        default: false,
        when: (answers) => answers.terminalCollection.name !== null
      }
    ]);

    if (answers.terminalCollection && answers.terminalCollection.name && answers.confirm) {
      const { name, rootPath } = answers.terminalCollection;
      await deleteTerminalCollectionCommand(name, rootPath);
    } else {
      logger.log("Operation cancelled.");
    }
  } catch (error) {
    logger.error("An error occurred during terminal collection deletion");
  }
} 