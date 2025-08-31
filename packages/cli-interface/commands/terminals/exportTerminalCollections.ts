import { ExportTerminalCollections, ExportTerminalCollectionOptions, ExportTerminalCollectionResult, Result } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function exportTerminalCollectionsCommand(options: ExportTerminalCollectionOptions): Promise<Result<ExportTerminalCollectionResult>> {
  const spinner = new CLISpinner();
  
  // ExportTerminalCollections is now self-contained and doesn't need dependencies
  const exportTerminalCollections = new ExportTerminalCollections();

  spinner.start("📤 Exporting terminal collections...");

  const result = await exportTerminalCollections.execute(options);

  if (result.ok) {
    spinner.succeed(`Terminal collections exported successfully to ${result.value.filePath}`);
    console.log(`   📊 Terminal collections exported: ${result.value.terminalCollectionCount}`);
    console.log(`   📜 Scripts bundled: ${result.value.scriptCount}`);
    console.log(`   📁 File location: ${result.value.filePath}`);
    console.log(`   🕒 Exported at: ${result.value.exportedAt}`);
    
    // Show selection details
    if (result.value.filters.terminalCollectionIds) {
      console.log(`   🆔 Selection mode: Specific IDs (${result.value.filters.terminalCollectionIds.length} selected)`);
    } else if (result.value.filters.rootPath) {
      console.log(`   📂 Selection mode: Root path filter (${result.value.filters.rootPath})`);
    } else if (result.value.filters.lifecycle) {
      console.log(`   🔄 Selection mode: Lifecycle filter (${result.value.filters.lifecycle})`);
    } else {
      console.log(`   🌟 Selection mode: All terminal collections`);
    }
  } else {
    spinner.fail("Failed to export terminal collections");
    console.error(`   Error: ${result.error.message}`);
  }

  return result;
} 