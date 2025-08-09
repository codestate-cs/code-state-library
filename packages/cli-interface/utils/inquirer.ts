import { ConfigurableLogger } from "@codestate/core";
import originalInquirer from "inquirer";

// Create a safe wrapper that doesn't modify the original inquirer
const inquirer = {
  ...originalInquirer,
  customPrompt: async function (questions: any): Promise<any> {
    try {
      return await originalInquirer.prompt(questions);
    } catch (error: any) {
      if (
        error.message?.includes("SIGINT") ||
        error.message?.includes("force closed")
      ) {
        const logger = new ConfigurableLogger();
        logger.plainLog("\n👋 You have exited CodeState CLI");
        process.exit(0);
      }
      throw error;
    }
  },
};

export default inquirer;
