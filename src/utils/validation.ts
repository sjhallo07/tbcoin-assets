import crypto from 'crypto';

export function applyValidationRules(value: unknown, rules?: string[]): void {
  if (!rules || rules.length === 0) {
    return;
  }

  for (const rule of rules) {
    const [name, rawParam] = rule.split(':');
    const param = rawParam ?? '';

    switch (name) {
      case 'max_length': {
        if (typeof value !== 'string') {
          throw new Error('Value must be string for max_length');
        }
        const limit = Number(param);
        if (Number.isNaN(limit)) {
          throw new Error('Invalid max_length rule');
        }
        if (value.length > limit) {
          throw new Error(`Value exceeds max length ${limit}`);
        }
        break;
      }
      case 'min': {
        if (typeof value !== 'number') {
          throw new Error('Value must be number for min');
        }
        const minValue = Number(param);
        if (Number.isNaN(minValue)) {
          throw new Error('Invalid min rule');
        }
        if (value < minValue) {
          throw new Error(`Value must be at least ${minValue}`);
        }
        break;
      }
      case 'max': {
        if (typeof value !== 'number') {
          throw new Error('Value must be number for max');
        }
        const maxValue = Number(param);
        if (Number.isNaN(maxValue)) {
          throw new Error('Invalid max rule');
        }
        if (value > maxValue) {
          throw new Error(`Value must be at most ${maxValue}`);
        }
        break;
      }
      case 'alpha_numeric': {
        if (typeof value !== 'string') {
          throw new Error('Value must be string for alpha_numeric');
        }
        if (!/^[a-z0-9]+$/i.test(value)) {
          throw new Error('Value must be alphanumeric');
        }
        break;
      }
      case 'numeric': {
        if (typeof value !== 'number') {
          throw new Error('Value must be numeric');
        }
        break;
      }
      default:
        throw new Error(`Unknown validation rule ${name}`);
    }
  }
}

/**
 * Canonicalizes a value for signature computation.
 * 
 * This custom implementation is used instead of JSON.stringify with a replacer
 * to ensure deterministic key ordering for objects, which is critical for
 * security-sensitive signature computation. JSON.stringify does not guarantee
 * key order, which can lead to inconsistent signatures for semantically
 * identical objects with different key orders. This function sorts object keys
 * recursively to produce a stable, canonical string representation.
 */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  const serialized = entries
    .map(([key, val]) => `${JSON.stringify(key)}:${canonicalize(val)}`)
    .join(',');
  return `{${serialized}}`;
}

export function computeSignature(payload: unknown, secret: string): string {
  const canonical = canonicalize(payload);
  return crypto.createHmac('sha256', secret).update(canonical).digest('hex');
}

export function verifySignature(payload: unknown, provided: string, secret: string): void {
  const expected = computeSignature(payload, secret);
  const providedBuffer = Buffer.from(provided, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw new Error('Invalid signature');
  }
}
