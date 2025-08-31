import { ImportSessions, ImportSessionOptions, ImportSessionResult, Result } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function importSessionsCommand(
  filePath: string,
  options: ImportSessionOptions = {}
): Promise<Result<ImportSessionResult>> {
  const spinner = new CLISpinner();
  
  // ImportSessions is now self-contained and doesn't need dependencies
  const importSessions = new ImportSessions();

  spinner.start("📥 Importing sessions...");

  const result = await importSessions.execute(filePath, options);

  if (result.ok) {
    spinner.succeed("Sessions imported successfully");
    console.log(`   📊 Sessions created: ${result.value.created}`);
    console.log(`   ⏭️  Sessions skipped: ${result.value.skipped}`);
    console.log(`   📜 Scripts created: ${result.value.scriptsCreated}`);
    console.log(`   ⏭️  Scripts skipped: ${result.value.scriptsSkipped}`);
    console.log(`   🖥️  Terminal collections created: ${result.value.terminalCollectionsCreated}`);
    console.log(`   ⏭️  Terminal collections skipped: ${result.value.terminalCollectionsSkipped}`);
    console.log(`   📋 Total processed: ${result.value.totalProcessed}`);
    
    if (result.value.errors.length > 0) {
      console.log(`   ⚠️  Errors encountered: ${result.value.errors.length}`);
      result.value.errors.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error}`);
      });
    }
  } else {
    spinner.fail("Failed to import sessions");
    console.error(`   Error: ${result.error.message}`);
  }

  return result;
} 