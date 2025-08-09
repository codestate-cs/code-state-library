import {
  ConfigurableLogger,
  DeleteSession,
  ListSessions,
} from "@codestate/core";
import inquirer from "../../utils/inquirer";

export async function deleteSessionCommand(sessionIdOrName?: string) {
  const logger = new ConfigurableLogger();
  const deleteSession = new DeleteSession();
  const listSessions = new ListSessions();

  try {
    // If no session ID/name provided, show interactive selection
    if (!sessionIdOrName) {
      logger.log("📋 Available Sessions:");
      logger.log("─────────────────────");

      const listResult = await listSessions.execute();

      if (!listResult.ok) {
        logger.error("Failed to list sessions", { error: listResult.error });
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
    const result = await deleteSession.execute(sessionIdOrName);

    if (result.ok) {
      logger.log(`✅ Session "${sessionIdOrName}" deleted successfully!`);
    } else {
      logger.error("Failed to delete session", { error: result.error });
    }
  } catch (error) {
    logger.error("Unexpected error while deleting session", { error });
  }
}
