import inquirer from "@codestate/cli-interface/utils/inquirer";
import { ConfigurableLogger, ResetAll } from "@codestate/core";

export async function resetTui() {
  const logger = new ConfigurableLogger();
  
  logger.plainLog("🔄 CodeState Reset");
  logger.plainLog("==================");
  logger.plainLog("");
  logger.plainLog("This will permanently delete the selected items. This action cannot be undone!");
  logger.plainLog("");

  const answers = await inquirer.customPrompt([
    {
      type: "checkbox",
      name: "resetItems",
      message: "Select what you want to reset:",
      choices: [
        { name: "📝 Sessions - All saved development sessions", value: "sessions" },
        { name: "📜 Scripts - All development scripts", value: "scripts" },
        { name: "🖥️  Terminals - All terminal collections", value: "terminals" },
        { name: "⚙️  Config - Configuration settings", value: "config" },
        { name: "💥 ALL - Reset everything (nuclear option)", value: "all" },
      ],
      validate: (input: string[]) => {
        if (input.length === 0) {
          return "Please select at least one item to reset";
        }
        return true;
      },
    },
    {
      type: "confirm",
      name: "confirm",
      message: "Are you absolutely sure you want to proceed? This cannot be undone!",
      default: false,
    },
  ]);

  if (!answers.confirm) {
    logger.plainLog("❌ Reset cancelled.");
    return;
  }

  // Convert selections to options
  const options: any = {};
  if (answers.resetItems.includes("all")) {
    options.all = true;
  } else {
    answers.resetItems.forEach((item: string) => {
      if (item !== "all") {
        options[item] = true;
      }
    });
  }

  // Show final warning
  const resetItems = answers.resetItems.filter((item: string) => item !== "all");
  logger.warn(` Final warning: This will permanently delete: ${resetItems.join(', ')}`);
  
  const finalConfirm = await inquirer.customPrompt([
    {
      type: "confirm",
      name: "finalConfirm",
      message: "Type 'yes' to confirm final deletion:",
      default: false,
    },
  ]);

  if (!finalConfirm.finalConfirm) {
    logger.plainLog("❌ Reset cancelled.");
    return;
  }

  // Execute reset
  const resetAll = new ResetAll();
  const result = await resetAll.execute(options);
  
  if (result.ok) {
    logger.log(` Successfully reset: ${result.value.resetItems.join(', ')}`);
    if (options.all) {
      logger.plainLog("🎉 CodeState has been completely reset to a fresh state!");
    }
  } else {
    logger.error("Failed to reset CodeState", { error: result.error });
  }
} 