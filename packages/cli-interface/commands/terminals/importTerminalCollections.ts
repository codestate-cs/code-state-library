import { ImportTerminalCollections, ImportTerminalCollectionOptions, ImportTerminalCollectionResult, Result } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function importTerminalCollectionsCommand(
  filePath: string,
  options: ImportTerminalCollectionOptions = {}
): Promise<Result<ImportTerminalCollectionResult>> {
  const spinner = new CLISpinner();
  
  // ImportTerminalCollections is now self-contained and doesn't need dependencies
  const importTerminalCollections = new ImportTerminalCollections();

  spinner.start("📥 Importing terminal collections...");

  const result = await importTerminalCollections.execute(filePath, options);

  if (result.ok) {
    spinner.succeed("Terminal collections imported successfully");
    console.log(`   📊 Terminal collections created: ${result.value.created}`);
    console.log(`   ⏭️  Terminal collections skipped: ${result.value.skipped}`);
    console.log(`   📜 Scripts created: ${result.value.scriptsCreated}`);
    console.log(`   ⏭️  Scripts skipped: ${result.value.scriptsSkipped}`);
    console.log(`   📋 Total processed: ${result.value.totalProcessed}`);
    
    if (result.value.errors.length > 0) {
      console.log(`   ⚠️  Errors encountered: ${result.value.errors.length}`);
      result.value.errors.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error}`);
      });
    }
  } else {
    spinner.fail("Failed to import terminal collections");
    console.error(`   Error: ${result.error.message}`);
  }

  return result;
} 