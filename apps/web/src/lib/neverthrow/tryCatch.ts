import { CustomResult } from "@/types/neverthrow";

interface TryCatchOptions {
  errorMessage?: string;
}

export async function tryCatch<T>(promise: Promise<T>, options?: TryCatchOptions): Promise<CustomResult<T, Error>> {
  try {
    const data = await promise;
    return { success: true, data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(options?.errorMessage ?? String(error)),
    };
  }
}
