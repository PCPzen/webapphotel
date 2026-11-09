/**
 * Helper to safely format error messages without leaking database or Prisma internals to the client.
 */
export function toSafeErrorMessage(err: unknown, fallbackMessage: string): string {
  console.error("[ServerError]:", err);

  if (err instanceof Error && err.message) {
    const msg = err.message;

    // Detect internal DB / Prisma / system errors
    const isTechnicalLeak =
      msg.includes("prisma") ||
      msg.includes("Prisma") ||
      msg.includes("database") ||
      msg.includes("Postgres") ||
      msg.includes("SELECT") ||
      msg.includes("INSERT") ||
      msg.includes("UPDATE") ||
      msg.includes("DELETE") ||
      msg.includes("foreign key") ||
      msg.includes("Unique constraint") ||
      msg.includes("connection") ||
      msg.includes("ETIMEDOUT") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("at ") ||
      msg.includes("\n");

    // In production, block all technical leaks
    if (process.env.NODE_ENV === "production" && isTechnicalLeak) {
      return fallbackMessage;
    }

    // If it's not a technical leak and is concise, allow message
    if (!isTechnicalLeak && msg.length < 120) {
      return msg;
    }
  }

  return fallbackMessage;
}
