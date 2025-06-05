import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

config.buildCommand = "next build --no-lint";

export default config;
