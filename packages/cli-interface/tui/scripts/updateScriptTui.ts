import inquirer from '@codestate/cli-interface/utils/inquirer';
import { updateScriptCommand } from '../../commands/scripts/updateScript';
import { Script } from '@codestate/cli-api/main';

export async function updateScriptTui() {
  const currentPath = process.cwd();
  const answers = await inquirer.customPrompt([
    {
      name: 'name',
      message: 'Script name to update:',
      type: 'input',
      validate: (input: string) => input.trim() ? true : 'Script name is required'
    },
    {
      name: 'rootPath',
      message: `Root path (current: ${currentPath}):`,
      type: 'input',
      default: currentPath,
      validate: (input: string) => input.trim() ? true : 'Root path is required'
    },
    {
      name: 'newName',
      message: 'New script name (leave empty to keep current):',
      type: 'input'
    },
    {
      name: 'newScript',
      message: 'New script command (leave empty to keep current):',
      type: 'input'
    }
  ]);

  const scriptUpdate: Partial<Script> = {};
  if (answers.newName.trim()) {
    scriptUpdate.name = answers.newName.trim();
  }
  if (answers.newScript.trim()) {
    scriptUpdate.script = answers.newScript.trim();
  }

  await updateScriptCommand(answers.name.trim(), answers.rootPath.trim(), scriptUpdate);
} 