import { sql } from "../src";

async function checkConnection() {
  const [result] = await sql<[{ databaseName: string; postgresVersion: string }]>`
    select
      current_database() as "databaseName",
      current_setting('server_version') as "postgresVersion"
  `;

  console.log(`Connected to PostgreSQL ${result.postgresVersion} database ${result.databaseName}`);

  await sql.end();
}

await checkConnection();
