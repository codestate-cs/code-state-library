import { ConfigurableLogger } from "@codestate/core";
import {
  deleteSessionCommand,
  listSessionsCommand,
  resumeSessionCommand,
  saveSessionCommand,
  updateSessionCommand,
} from "../../commands/session";

export async function handleSessionCommand(
  subcommand: string,
  options: string[]
) {
  const logger = new ConfigurableLogger();

  switch (subcommand) {
    case "save":
      await saveSessionCommand();
      break;
    case "resume":
      const sessionIdOrName = options[0];
      await resumeSessionCommand(sessionIdOrName);
      break;
    case "update":
      const updateSessionIdOrName = options[0];
      await updateSessionCommand(updateSessionIdOrName);
      break;
    case "list":
      await listSessionsCommand();
      break;
    case "delete":
      const deleteSessionIdOrName = options[0];
      await deleteSessionCommand(deleteSessionIdOrName);
      break;
    default:
      logger.error(`Error: Unknown session subcommand '${subcommand}'`);
      logger.plainLog(
        "Available session commands: save, resume, update, list, delete"
      );
      process.exit(1);
  }
}
