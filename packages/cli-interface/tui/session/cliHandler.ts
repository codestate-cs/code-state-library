import { saveSessionCommand } from '../../commands/session';
import { resumeSessionCommand } from '../../commands/session';
import { updateSessionCommand } from '../../commands/session';
import { listSessionsCommand } from '../../commands/session';
import { deleteSessionCommand } from '../../commands/session';
import { ConfigurableLogger } from '@codestate/core/api';

export async function handleSessionCommand(subcommand: string, options: string[]) {
  const logger = new ConfigurableLogger();
  
  switch (subcommand) {
    case 'save':
      await saveSessionCommand();
      break;
    case 'resume':
      const sessionIdOrName = options[0];
      await resumeSessionCommand(sessionIdOrName);
      break;
    case 'update':
      const updateSessionIdOrName = options[0];
      await updateSessionCommand(updateSessionIdOrName);
      break;
    case 'list':
      await listSessionsCommand();
      break;
    case 'delete':
      const deleteSessionIdOrName = options[0];
      await deleteSessionCommand(deleteSessionIdOrName);
      break;
    default:
      logger.error(`Error: Unknown session subcommand '${subcommand}'`);
      logger.plainLog('Available session commands: save, resume, update, list, delete');
      process.exit(1);
  }
} 