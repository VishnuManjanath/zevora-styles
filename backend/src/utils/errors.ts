export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  notFound: (msg = "Resource not found") => new AppError(404, "NOT_FOUND", msg),
  unauthorized: (msg = "Unauthorized") => new AppError(401, "UNAUTHORIZED", msg),
  forbidden: (msg = "Forbidden") => new AppError(403, "FORBIDDEN", msg),
  badRequest: (code: string, msg: string) => new AppError(400, code, msg),
  guardrailCap: () =>
    new AppError(403, "GUARDRAIL_CAP_EXCEEDED", "Refund exceeds auto-resolve cap without HITL approval"),
  guardrailClause: () =>
    new AppError(400, "GUARDRAIL_CLAUSE_INVALID", "Invalid or inactive policy clause"),
  guardrailAmount: () =>
    new AppError(400, "GUARDRAIL_AMOUNT_EXCEEDS_ORDER", "Refund amount exceeds refundable balance"),
};
