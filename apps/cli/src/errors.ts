export interface CliValidationIssue {
  code: string;
  message: string;
  path: string;
}

export class CliError extends Error {
  public constructor(
    public readonly exitCode: number,
    public readonly code: string,
    message: string,
    public readonly issues?: CliValidationIssue[],
  ) {
    super(message);
    this.name = "CliError";
  }
}

interface ValidationIssueLike {
  code: string;
  message: string;
  path: Array<PropertyKey>;
}

export function createValidationError(subject: string, issues: ValidationIssueLike[]): CliError {
  return new CliError(
    3,
    "VALIDATION_ERROR",
    `${subject} is invalid`,
    issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      path: issue.path.map(String).join("."),
    })),
  );
}
