import { createBuilder } from "@content-collections/core";

async function generateContentCollections() {
  const builder = await createBuilder("content-collections.ts");
  await builder.build();
}

await generateContentCollections();
