import { ExportScripts, ExportOptions, ExportResult, Result } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function exportScriptsCommand(options: ExportOptions): Promise<Result<ExportResult>> {
  const spinner = new CLISpinner();
  
  // ExportScripts is now self-contained and doesn't need dependencies
  const exportScripts = new ExportScripts();

  spinner.start("📤 Exporting scripts...");

  const result = await exportScripts.execute(options);

  if (result.ok) {
    spinner.succeed(`Scripts exported successfully to ${result.value.filePath}`);
    console.log(`   📊 Scripts exported: ${result.value.scriptCount}`);
    console.log(`   📁 File location: ${result.value.filePath}`);
    console.log(`   🕒 Exported at: ${result.value.exportedAt}`);
    
    // Show selection details
    if (result.value.filters.scriptIds) {
      console.log(`   🆔 Selection mode: Specific IDs (${result.value.filters.scriptIds.length} selected)`);
    } else if (result.value.filters.rootPath) {
      console.log(`   📂 Selection mode: Root path filter (${result.value.filters.rootPath})`);
    } else if (result.value.filters.lifecycle) {
      console.log(`   🔄 Selection mode: Lifecycle filter (${result.value.filters.lifecycle})`);
    } else {
      console.log(`   🌟 Selection mode: All scripts`);
    }
  } else {
    spinner.fail("Failed to export scripts");
    console.error(`   Error: ${result.error.message}`);
  }

  return result;
} 