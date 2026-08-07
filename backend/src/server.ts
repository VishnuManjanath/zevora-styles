import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

async function main() {
  await connectDb();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`Zevora Styles API running on http://localhost:${env.PORT}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${env.PORT} is already in use. Kill the old server:\n  kill $(lsof -t -i:${env.PORT})`,
      );
      process.exit(1);
    }
    throw err;
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
