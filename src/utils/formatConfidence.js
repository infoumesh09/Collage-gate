// Formats a confidence value to a 0–100 integer percent.
// Accepts values in either [0,1] or [0,100] scale and normalizes.
export function formatConfidence(value) {
  if (value === null || value === undefined) return null;
  let v = Number(value);
  if (Number.isNaN(v)) return null;
  // If value is <= 1.5, treat as 0–1 and scale up; otherwise assume 0–100
  if (v <= 1.5) v = v * 100;
  // Clamp and round
  v = Math.max(0, Math.min(100, v));
  return Math.round(v);
}

