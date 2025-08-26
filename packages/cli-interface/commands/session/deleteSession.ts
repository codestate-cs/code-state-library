import {
  ConfigurableLogger,
  DeleteSession,
  ListSessions,
} from "@codestate/core";
import inquirer from "../../utils/inquirer";
import { CLISpinner } from "../../utils/CLISpinner";

export async function deleteSessionCommand(sessionIdOrName?: string) {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const deleteSession = new DeleteSession();
  const listSessions = new ListSessions();

  try {
    // If no session ID/name provided, show interactive selection
    if (!sessionIdOrName) {
      logger.plainLog("📋 Available Sessions:");
      logger.plainLog("─────────────────────");

      const listResult = await listSessions.execute();

      if (!listResult.ok) {
        logger.error("Failed to list sessions");
        return;
      }

      const sessions = listResult.value;

      if (sessions.length === 0) {
        logger.log("No sessions found to delete.");
        return;
      }

      // Create choices for inquirer
      const choices = sessions.map((session) => ({
        name: `${session.name} (${session.projectRoot}) - ${session.id}`,
        value: session.id,
      }));

      const { selectedSessionId } = await inquirer.customPrompt([
        {
          type: "list",
          name: "selectedSessionId",
          message: "Select a session to delete:",
          choices,
        },
      ]);

      sessionIdOrName = selectedSessionId;
    }

    // Confirm deletion
    const { confirm } = await inquirer.customPrompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to delete session "${sessionIdOrName}"?`,
        default: false,
      },
    ]);

    if (!confirm) {
      logger.log("Session deletion cancelled.");
      return;
    }

    // Delete the session
    spinner.start("🗑️  Deleting session...");
    
    const result = await deleteSession.execute(sessionIdOrName!);

    if (result.ok) {
      spinner.succeed("Session deleted successfully!");
      logger.log(`Session "${sessionIdOrName}" deleted successfully!`);
    } else {
      spinner.fail("Failed to delete session");
      logger.error("Failed to delete session");
    }
  } catch (error) {
    logger.error("Unexpected error while deleting session");
  }
}
