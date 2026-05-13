export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isComplaintLike(message: string): boolean {
  return /\b(not working|broken|refund|angry|terrible|dirty|unsafe|no hot water|ac not|issue|complain|complaint)\b/i.test(message);
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
