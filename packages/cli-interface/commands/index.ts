import { handleConfigCommand } from '../tui/config';
import { handleScriptCommand } from '../tui/scripts';
import { handleSessionCommand } from '../tui/session';

export async function handleCommand(command: string, subcommand: string, options: string[]) {
  switch (command) {
    case 'config':
      await handleConfigCommand(subcommand, options);
      break;
    case 'scripts':
      await handleScriptCommand(subcommand, options);
      break;
    case 'session':
      await handleSessionCommand(subcommand, options);
      break;
    default:
      console.error(`Error: Unknown command '${command}'`);
      console.log('Available commands: config, scripts, session, git');
      process.exit(1);
  }
}