import inquirer from '@codestate/cli-interface/utils/inquirer';
import { resetConfigCommand } from '../../commands/config/resetConfig';

export async function resetConfigTui() {
  const { confirm } = await inquirer.customPrompt([
    { name: 'confirm', message: 'Are you sure you want to reset config to defaults?', type: 'confirm' }
  ]);
  if (confirm) {
    await resetConfigCommand();
  }
} 