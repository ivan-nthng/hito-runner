export function runnerFacingHeartRateSaveError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (!message || message.startsWith("[") || message.includes('"code"')) {
    return fallback;
  }

  return message;
}
