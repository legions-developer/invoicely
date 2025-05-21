import { hellotest } from "../services/hello/hello";
import { createTRPCRouter } from "@/trpc/init";

export const helloRouter = createTRPCRouter({
  hello: hellotest,
});
