import { saveSessionCommand } from '../../commands/session';
import { resumeSessionCommand } from '../../commands/session';

export async function handleSessionCommand(subcommand: string, options: string[]) {
  switch (subcommand) {
    case 'save':
      await saveSessionCommand();
      break;
    case 'resume':
      const sessionIdOrName = options[0];
      await resumeSessionCommand(sessionIdOrName);
      break;
    default:
      console.error(`Error: Unknown session subcommand '${subcommand}'`);
      console.log('Available session commands: save, resume, update, list, delete');
      process.exit(1);
  }
} 