const SENSITIVE_KEY = /(password|admin_password|token|secret|api[_-]?key|authorization)/i;

const redactArray = (value: unknown[], depth: number): unknown[] =>
  value.map((v) => redactSecrets(v, depth + 1));

const redactObject = (value: Record<string, unknown>, depth: number): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = SENSITIVE_KEY.test(k) ? '[REDACTED]' : redactSecrets(v, depth + 1);
  }
  return out;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') return false;
  return true;
};

// eslint-disable-next-line complexity -- branching mirrors recursive shape (depth, array, object)
export const redactSecrets = (value: unknown, depth: number = 0): unknown => {
  if (depth > 10) return '[Truncated]';
  if (Array.isArray(value)) return redactArray(value, depth);
  if (!isPlainObject(value)) return value;
  return redactObject(value, depth);
};
