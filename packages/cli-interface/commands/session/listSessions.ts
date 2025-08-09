import { ConfigurableLogger, ListSessions } from "@codestate/core";

export async function listSessionsCommand() {
  const logger = new ConfigurableLogger();
  const listSessions = new ListSessions();

  try {
    logger.log("📋 Available Sessions:");
    logger.log("─────────────────────");

    const result = await listSessions.execute();

    if (!result.ok) {
      logger.error("Failed to list sessions", { error: result.error });
      return;
    }

    const sessions = result.value;

    if (sessions.length === 0) {
      logger.log("No sessions found.");
      return;
    }

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
        logger.log(
          `\n📁 ${projectPath} (${projectSessions.length} session${
            projectSessions.length > 1 ? "s" : ""
          })`
        );
        logger.log("─".repeat(projectPath.length + 10));

        projectSessions.forEach((session) => {
          const tags =
            session.tags.length > 0 ? ` [${session.tags.join(", ")}]` : "";
          const notes = session.notes ? ` - ${session.notes}` : "";
          logger.log(`  • ${session.name}${tags}${notes}`);
          logger.log(
            `    ID: ${session.id} | Created: ${new Date(
              session.createdAt
            ).toLocaleString()}`
          );
          if (session.git) {
            logger.log(
              `    Git: ${session.git.branch} (${session.git.commit.substring(
                0,
                8
              )})`
            );
          }
        });
      }
    );

    logger.log(
      `\nTotal: ${sessions.length} session${sessions.length > 1 ? "s" : ""}`
    );
  } catch (error) {
    logger.error("Unexpected error while listing sessions", { error });
  }
}
