export type CustomResult<T, E> = { success: true; data: T; error?: never } | { success: false; data?: never; error: E };
