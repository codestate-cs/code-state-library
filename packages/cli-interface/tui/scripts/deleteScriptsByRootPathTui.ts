import inquirer from '@codestate/cli-interface/utils/inquirer';
import { deleteScriptsByRootPathCommand } from '../../commands/scripts/deleteScriptsByRootPath';

export async function deleteScriptsByRootPathTui() {
  const currentPath = process.cwd();
  const answers = await inquirer.customPrompt([
    {
      name: 'rootPath',
      message: `Root path to delete all scripts from (current: ${currentPath}):`,
      type: 'input',
      default: currentPath,
      validate: (input: string) => input.trim() ? true : 'Root path is required'
    },
    {
      name: 'confirm',
      message: 'Are you sure you want to delete ALL scripts for this root path?',
      type: 'confirm',
      default: false
    }
  ]);

  if (answers.confirm) {
    await deleteScriptsByRootPathCommand(answers.rootPath.trim());
  } else {
    console.log('Script deletion cancelled.');
  }
} 