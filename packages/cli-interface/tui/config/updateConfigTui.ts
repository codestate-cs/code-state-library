import inquirer from "@codestate/cli-interface/utils/inquirer";
import { Config } from "@codestate/core";
import { updateConfigCommand } from "../../commands/config/updateConfig";

export async function updateConfigTui() {
  const answers = await inquirer.customPrompt([
    {
      name: "ide",
      message: "Default IDE:",
      type: "list",
      choices: ["cursor", "vscode"],
    },
    { name: "encryption", message: "Enable encryption?", type: "confirm" },
  ]);
  let encryptionKey: string | undefined = undefined;
  if (answers.encryption) {
    const keyAnswer = await inquirer.customPrompt([
      {
        name: "encryptionKey",
        message: "Encryption key:",
        type: "password",
        mask: "*",
      },
    ]);
    encryptionKey = keyAnswer.encryptionKey;
  }
  const partial: Partial<Config> = {
    ide: answers.ide,
    encryption: { enabled: answers.encryption, encryptionKey },
  };
  await updateConfigCommand(partial);
}
