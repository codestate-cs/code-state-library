import { ImportScripts, ImportOptions, ImportResult, Result } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function importScriptsCommand(
  filePath: string,
  options: ImportOptions = {}
): Promise<Result<ImportResult>> {
  const spinner = new CLISpinner();
  
  // ImportScripts is now self-contained and doesn't need dependencies
  const importScripts = new ImportScripts();

  spinner.start("📥 Importing scripts...");

  const result = await importScripts.execute(filePath, options);

  if (result.ok) {
    spinner.succeed("Scripts imported successfully");
    console.log(`   📊 Scripts created: ${result.value.created}`);
    console.log(`   ⏭️  Scripts skipped: ${result.value.skipped}`);
    console.log(`   📋 Total processed: ${result.value.totalProcessed}`);
    
    if (result.value.errors.length > 0) {
      console.log(`   ⚠️  Errors encountered: ${result.value.errors.length}`);
      result.value.errors.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error}`);
      });
    }
  } else {
    spinner.fail("Failed to import scripts");
    console.error(`   Error: ${result.error.message}`);
  }

  return result;
} 