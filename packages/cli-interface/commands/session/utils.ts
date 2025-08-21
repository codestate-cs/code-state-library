import { ConfigurableLogger, SaveSession } from "@codestate/core";
import inquirer from "../../utils/inquirer";

export async function promptSessionDetails(defaults?: {
  name?: string;
  notes?: string;
  tags?: string;
  terminalCollectionChoices?: Array<{ name: string; value: string }>;
  scriptChoices?: Array<{ name: string; value: string }>;
}) {
  const prompts = [
    {
      type: "input",
      name: "sessionName",
      message: "Enter session name:",
      default: defaults?.name || "",
      validate: (input: string) => {
        if (!input.trim()) {
          return "Session name is required";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "sessionNotes",
      message: "Enter session notes (optional):",
      default: defaults?.notes || "",
    },
    {
      type: "input",
      name: "sessionTags",
      message: "Enter session tags (comma-separated, optional):",
      default: defaults?.tags || "",
    },
  ];

  // Only add terminal collections prompt if there are choices available
  if (defaults?.terminalCollectionChoices && defaults.terminalCollectionChoices.length > 0) {
    prompts.push({
      type: "checkbox",
      name: "terminalCollections",
      message: "Select terminal collections to include in this session:",
      choices: defaults.terminalCollectionChoices,
      default: [],
    });
  }

  // Only add scripts prompt if there are choices available
  if (defaults?.scriptChoices && defaults.scriptChoices.length > 0) {
    prompts.push({
      type: "checkbox",
      name: "scripts",
      message: "Select individual scripts to include in this session:",
      choices: defaults.scriptChoices,
      default: [],
    });
  }

  const result = await inquirer.customPrompt(prompts);
  
  // Ensure terminalCollections is always present in the result
  if (!result.terminalCollections) {
    result.terminalCollections = [];
  }

  // Ensure scripts is always present in the result
  if (!result.scripts) {
    result.scripts = [];
  }
  
  return result as {
    sessionName: string;
    sessionNotes: string;
    sessionTags: string;
    terminalCollections: string[];
    scripts: string[];
  };
}

export async function promptDirtyState(gitStatus: any, canStash: boolean) {
  const choices = [{ name: "Commit changes", value: "commit" }];
  // if (canStash) {
  //   choices.push({ name: "Stash changes", value: "stash" });
  // }
  choices.push({ name: "Cancel", value: "cancel" });
  return inquirer.customPrompt([
    {
      type: "list",
      name: "dirtyAction",
      message: "How would you like to handle these changes?",
      choices,
    },
  ]);
}

export async function getCurrentGitState(gitService: any, logger: any) {
  const currentBranchResult = await gitService.getCurrentBranch();
  const currentCommitResult = await gitService.getCurrentCommit();
  const isDirtyResult = await gitService.getIsDirty();

  if (!currentBranchResult.ok || !currentCommitResult.ok || !isDirtyResult.ok) {
    logger.error("Failed to get Git state", {
      branchError: currentBranchResult.ok
        ? undefined
        : currentBranchResult.error,
      commitError: currentCommitResult.ok
        ? undefined
        : currentCommitResult.error,
      isDirtyError: isDirtyResult.ok ? undefined : isDirtyResult.error,
    });
    return null;
  }

  return {
    branch: currentBranchResult.value,
    commit: currentCommitResult.value,
    isDirty: isDirtyResult.value,
    stashId: null, // No stash ID for current state
  };
}

export async function handleSessionSave({
  sessionDetails,
  projectRoot,
  git,
  saveSession,
  logger,
}: {
  sessionDetails: {
    sessionName: string;
    sessionNotes: string;
    sessionTags: string;
    terminalCollections: string[];
    scripts: string[];
  };
  projectRoot: string;
  git: {
    branch: string;
    commit: string;
    isDirty: boolean;
    stashId: string | null;
  };
  saveSession: typeof SaveSession.prototype;
  logger: typeof ConfigurableLogger.prototype;
}) {
  const result = await saveSession.execute({
    name: sessionDetails.sessionName,
    projectRoot,
    notes: sessionDetails.sessionNotes || "",
    tags: sessionDetails.sessionTags
      .split(",")
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0),
    files: [],
    git,
    extensions: {},
    terminalCollections: sessionDetails.terminalCollections || [],
    scripts: sessionDetails.scripts || [],
  });
  if (result.ok) {
    logger.log(
      `✅ Session "${sessionDetails.sessionName}" saved successfully!`
    );
  } else {
    logger.error("Failed to save session", { error: result.error });
  }
  return result;
}
