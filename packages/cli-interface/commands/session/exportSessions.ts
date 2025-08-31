import { ExportSessions, ExportSessionOptions, ExportSessionResult, Result } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function exportSessionsCommand(options: ExportSessionOptions): Promise<Result<ExportSessionResult>> {
  const spinner = new CLISpinner();
  
  // ExportSessions is now self-contained and doesn't need dependencies
  const exportSessions = new ExportSessions();

  spinner.start("📤 Exporting sessions...");

  const result = await exportSessions.execute(options);

  if (result.ok) {
    spinner.succeed(`Sessions exported successfully to ${result.value.filePath}`);
    console.log(`   📊 Sessions exported: ${result.value.sessionCount}`);
    console.log(`   📜 Scripts bundled: ${result.value.scriptCount}`);
    console.log(`   🖥️  Terminal collections bundled: ${result.value.terminalCollectionCount}`);
    console.log(`   📁 File location: ${result.value.filePath}`);
    console.log(`   🕒 Exported at: ${result.value.exportedAt}`);
    
    // Show selection details
    if (result.value.filters.sessionIds) {
      console.log(`   🆔 Selection mode: Specific IDs (${result.value.filters.sessionIds.length} selected)`);
    } else if (result.value.filters.tags && result.value.filters.tags.length > 0) {
      console.log(`   🏷️  Selection mode: Tags filter (${result.value.filters.tags.join(', ')})`);
    } else if (result.value.filters.search) {
      console.log(`   🔍 Selection mode: Search filter ("${result.value.filters.search}")`);
    } else {
      console.log(`   🌟 Selection mode: All sessions`);
    }
  } else {
    spinner.fail("Failed to export sessions");
    console.error(`   Error: ${result.error.message}`);
  }

  return result;
} 