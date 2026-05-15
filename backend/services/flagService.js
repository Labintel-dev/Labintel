'use strict';
/**
 * flagService — pure function, no external dependencies.
 * Computes the clinical flag for a test value against gender-specific reference ranges.
 * Critical threshold = 20% of the normal range outside normal bounds.
 *
 * Write and test this FIRST — all report routes depend on it.
 */

/**
 * @param {number|string} value    - The measured test result
 * @param {string}        gender   - 'male' | 'female' | 'other'
 * @param {object}        parameter - test_parameters row with ref_min/max fields
 * @returns {'normal'|'low'|'high'|'critical_low'|'critical_high'}
 */
function computeFlag(value, gender, parameter) {
  const v = parseFloat(value);
  if (isNaN(v)) return 'normal'; // safe fallback for invalid input

  const isFemale = gender === 'female';

  const min = isFemale ? parameter.ref_min_female : parameter.ref_min_male;
  const max = isFemale ? parameter.ref_max_female : parameter.ref_max_male;

  // If no reference range is configured, cannot flag
  if (min === null || min === undefined || max === null || max === undefined) {
    return 'normal';
  }

  const range = max - min;
  const criticalThreshold = range * 0.20; // 20% outside normal = critical

  if (v < min - criticalThreshold) return 'critical_low';
  if (v > max + criticalThreshold) return 'critical_high';
  if (v < min)                      return 'low';
  if (v > max)                      return 'high';
  return 'normal';
}

module.exports = { computeFlag };

/*
 * Self-test (run with node services/flagService.js to verify):
 *
 * Hemoglobin female range: 12–16 → range=4, critical threshold=0.8
 *   9.4   → < 12 - 0.8 = 11.2 → critical_low  ✓
 *  11.4   → < 12 but > 11.2   → low            ✓
 *  13.5   → within range       → normal         ✓
 *
 * WBC range: 4500–11000 → range=6500, critical threshold=1300
 *  12000  → > 11000 but < 12300 → high           ✓
 *  15000  → > 12300              → critical_high  ✓
 *
 * Glucose female range: 70–100 → range=30, critical threshold=6
 *   65    → < 70 but > 64 → low                  ✓
 *   63    → < 64           → critical_low         ✓
 *
 * Note: The backend doc's example table (WBC 13500 → high, Hb 11.0 → low)
 * had minor numeric inconsistencies vs the "20% of range" formula.
 * This implementation follows the formula as specified.
 */

if (require.main === module) {
  const hb = { ref_min_male: 13, ref_max_male: 17, ref_min_female: 12, ref_max_female: 16 };
  const wbc = { ref_min_male: 4500, ref_max_male: 11000, ref_min_female: 4500, ref_max_female: 11000 };
  const glc = { ref_min_male: 70, ref_max_male: 100, ref_min_female: 70, ref_max_female: 100 };

  const tests = [
    [9.4,   'female', hb,  'critical_low'],   // < 12 - 0.8 = 11.2
    [11.4,  'female', hb,  'low'],             // < 12 but > 11.2
    [13.5,  'female', hb,  'normal'],
    [12000, 'male',   wbc, 'high'],            // > 11000 but < 12300
    [15000, 'male',   wbc, 'critical_high'],   // > 12300
    [65,    'female', glc, 'low'],
    [NaN,   'male',   hb,  'normal'],
    [10,    'male',   { ref_min_male: null, ref_max_male: null }, 'normal'],
  ];

  let passed = 0;
  tests.forEach(([val, gender, param, expected]) => {
    const result = computeFlag(val, gender, param);
    const ok = result === expected;
    console.log(`${ok ? '✅' : '❌'} computeFlag(${val}, ${gender}) → ${result} (expected: ${expected})`);
    if (ok) passed++;
  });
  console.log(`\n${passed}/${tests.length} tests passed`);
}
