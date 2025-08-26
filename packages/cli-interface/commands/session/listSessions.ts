import { ConfigurableLogger, ListSessions } from "@codestate/core";
import { CLISpinner } from "../../utils/CLISpinner";

export async function listSessionsCommand() {
  const logger = new ConfigurableLogger();
  const spinner = new CLISpinner();
  const listSessions = new ListSessions();

  try {
    spinner.start("📋 Loading sessions...");
    
    const result = await listSessions.execute();

    if (!result.ok) {
      spinner.fail("Failed to load sessions");
      logger.error("Failed to list sessions");
      return;
    }

    spinner.succeed("Sessions loaded");
    
    const sessions = result.value;

    if (sessions.length === 0) {
      logger.plainLog("No sessions found.");
      return;
    }

    logger.plainLog("📋 Available Sessions:");
    logger.plainLog("─────────────────────");

    // Group sessions by project path
    const sessionsByProject = sessions.reduce((acc, session) => {
      const projectPath = session.projectRoot;
      if (!acc[projectPath]) {
        acc[projectPath] = [];
      }
      acc[projectPath].push(session);
      return acc;
    }, {} as Record<string, typeof sessions>);

    // Display sessions grouped by project
    Object.entries(sessionsByProject).forEach(
      ([projectPath, projectSessions]) => {
        logger.plainLog(
          `\n📁 ${projectPath} (${projectSessions.length} session${
            projectSessions.length > 1 ? "s" : ""
          })`
        );
        logger.plainLog("─".repeat(projectPath.length + 10));

        projectSessions.forEach((session) => {
          const tags =
            session.tags.length > 0 ? ` [${session.tags.join(", ")}]` : "";
          const notes = session.notes ? ` - ${session.notes}` : "";
          logger.plainLog(`  • ${session.name}${tags}${notes}`);
          logger.plainLog(
            `    ID: ${session.id} | Created: ${new Date(
              session.createdAt
            ).toLocaleString()}`
          );
          if (session.git) {
            logger.plainLog(
              `    Git: ${session.git.branch} (${session.git.commit.substring(
                0,
                8
              )})`
            );
          }
          
          // Show terminal commands info if available
          if ((session as any).terminalCommands && (session as any).terminalCommands.length > 0) {
            const terminalCount = (session as any).terminalCommands.length;
            logger.plainLog(`    🖥️  Terminals: ${terminalCount} terminal${terminalCount > 1 ? 's' : ''}`);
          }
          
          // Show files info if available
          if (session.files && session.files.length > 0) {
            const filesWithPosition = session.files.filter((f: any) => f.position !== undefined);
            if (filesWithPosition.length > 0) {
              logger.plainLog(`    📁 Files: ${session.files.length} (${filesWithPosition.length} with position)`);
            } else {
              logger.plainLog(`    📁 Files: ${session.files.length}`);
            }
          }
        });
      }
    );

    logger.plainLog(
      `\nTotal: ${sessions.length} session${sessions.length > 1 ? "s" : ""}`
    );
  } catch (error) {
    logger.error("Unexpected error while listing sessions");
  }
}
