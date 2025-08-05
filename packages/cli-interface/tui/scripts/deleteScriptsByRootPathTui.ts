import inquirer from '@codestate/cli-interface/utils/inquirer';
import { deleteScriptsByRootPathCommand } from '../../commands/scripts/deleteScriptsByRootPath';
import { ConfigurableLogger } from '@codestate/core/api';

export async function deleteScriptsByRootPathTui() {
  const logger = new ConfigurableLogger();
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
    logger.plainLog('Script deletion cancelled.');
  }
} 