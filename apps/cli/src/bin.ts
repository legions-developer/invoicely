#!/usr/bin/env bun

import { executeCli } from "./commands";
import { processCliIo } from "./io";

process.exitCode = await executeCli(process.argv.slice(2), processCliIo);
