
import { app } from "./app.js";
import { checkDatabaseConnection, pool } from "./db.js";
import { logger } from "./logger.js";

const port = Number(process.env.PORT ?? 3000);

async function startServer() {
  try {
    await checkDatabaseConnection();

    const server = app.listen(port, () => {
      logger.info(`Cashback Detective API running at http://localhost:${port}`);
    });

    const shutdown = () => {
      server.close(() => {
        void pool.end().then(() => process.exit(0));
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    logger.error({ err: error }, "Could not start the application");
    await pool.end();
    process.exit(1);
  }
}

void startServer();
