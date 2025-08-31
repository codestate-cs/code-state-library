import { CreateScript, Script, Result } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function createScriptCommand(script: Script): Promise<Result<void>> {
  const spinner = new CLISpinner();
  const createScript = new CreateScript();
  
  spinner.start("📜 Creating script...");
  
  const result = await createScript.execute(script);

  if (result.ok) {
    spinner.succeed(`Script '${script.name}' created successfully`);
  } else {
    spinner.fail("Failed to create script");
  }
  
  return result;
}
