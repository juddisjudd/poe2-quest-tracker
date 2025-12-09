/**
 * Regex Pattern Optimizer for POE2's 45-character search limit
 * Provides utilities to compress and optimize regex patterns
 */

interface OptimizationResult {
  pattern: string;
  length: number;
  savedChars: number;
  optimizations: string[];
}

/**
 * Optimize a regex pattern to fit within character limit
 * @param pattern - The original regex pattern
 * @param maxLength - Maximum allowed length (default 45 for POE2)
 * @returns Optimized pattern with metadata
 */
export function optimizePattern(pattern: string, maxLength: number = 45): OptimizationResult {
  let optimized = pattern;
  const originalLength = pattern.length;
  const appliedOptimizations: string[] = [];

  // Remove outer quotes if present (we'll add them back at the end)
  const hasQuotes = optimized.startsWith('"') && optimized.endsWith('"');
  if (hasQuotes) {
    optimized = optimized.slice(1, -1);
  }

  // 1. Remove redundant parentheses in OR patterns
  if (optimized.includes('|')) {
    const withoutParens = optimized.replace(/^\((.+)\)$/, '$1');
    if (withoutParens !== optimized) {
      optimized = withoutParens;
      appliedOptimizations.push('Removed outer parentheses');
    }
  }

  // 2. Simplify common character classes
  const charClassSimplifications: [RegExp, string, string][] = [
    [/\[0-9\]/g, '\\d', 'Replaced [0-9] with \\d'],
    [/\[a-zA-Z\]/g, '\\w', 'Replaced [a-zA-Z] with \\w'],
  ];

  for (const [pattern, replacement, description] of charClassSimplifications) {
    const simplified = optimized.replace(pattern, replacement);
    if (simplified !== optimized) {
      optimized = simplified;
      appliedOptimizations.push(description);
    }
  }

  // 3. Combine consecutive alternations with common prefixes
  // Example: "fire.*res|cold.*res|lightning.*res" -> "(fire|cold|lightning).*res"
  optimized = combineAlternationsWithCommonSuffix(optimized, appliedOptimizations);

  // 4. Remove unnecessary .* at start/end if pattern still too long
  if (optimized.length > maxLength) {
    const withoutLeadingWildcard = optimized.replace(/^\.\*/, '');
    if (withoutLeadingWildcard !== optimized && withoutLeadingWildcard.length <= maxLength) {
      optimized = withoutLeadingWildcard;
      appliedOptimizations.push('Removed leading .*');
    }
  }

  if (optimized.length > maxLength) {
    const withoutTrailingWildcard = optimized.replace(/\.\*$/, '');
    if (withoutTrailingWildcard !== optimized && withoutTrailingWildcard.length <= maxLength) {
      optimized = withoutTrailingWildcard;
      appliedOptimizations.push('Removed trailing .*');
    }
  }

  // Add quotes back if they were present
  if (hasQuotes) {
    optimized = `"${optimized}"`;
  }

  return {
    pattern: optimized,
    length: optimized.length,
    savedChars: originalLength - optimized.length,
    optimizations: appliedOptimizations,
  };
}

/**
 * Combine alternations that share common suffixes
 * Example: "abc|def|ghi" with common suffix -> optimized form
 */
function combineAlternationsWithCommonSuffix(pattern: string, appliedOptimizations: string[]): string {
  // This is a simplified version - full implementation would handle more complex cases
  // For now, we'll handle common patterns like ".*res" suffix

  // Match patterns like: "fire.*res|cold.*res|lightning.*res"
  const resPattern = /(\w+)\.\*res\|(\w+)\.\*res(?:\|(\w+)\.\*res)?/g;

  let optimized = pattern.replace(resPattern, (_match, g1, g2, g3) => {
    if (g3) {
      appliedOptimizations.push('Combined resistance patterns');
      return `(${g1}|${g2}|${g3}).*res`;
    } else {
      appliedOptimizations.push('Combined resistance patterns');
      return `(${g1}|${g2}).*res`;
    }
  });

  return optimized;
}

/**
 * Split a pattern into multiple AND-joined patterns if it's too long
 * This converts a single long OR pattern into multiple shorter ones
 */
export function splitPatternForAND(pattern: string, maxLength: number = 45): string[] {
  // Remove quotes for processing
  const cleaned = pattern.replace(/^"|"$/g, '');

  // If it's an OR pattern, split on |
  if (cleaned.includes('|')) {
    const parts = cleaned.replace(/^\(|\)$/g, '').split('|');
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (const part of parts) {
      const partLength = part.length + 3; // +3 for quotes and separator
      if (currentLength + partLength > maxLength && currentChunk.length > 0) {
        // Start a new chunk
        chunks.push(`"(${currentChunk.join('|')})"`);
        currentChunk = [part];
        currentLength = partLength;
      } else {
        currentChunk.push(part);
        currentLength += partLength;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(`"(${currentChunk.join('|')})"`);
    }

    return chunks;
  }

  // If it's already space-separated (AND), split on spaces
  if (cleaned.includes(' ')) {
    return cleaned.split(' ').map(p => p.trim()).filter(p => p.length > 0);
  }

  // Single pattern, return as-is
  return [pattern];
}

/**
 * Suggest alternative shorter patterns for common mods
 */
export function suggestShorterAlternatives(modNames: string[]): Map<string, string> {
  const suggestions = new Map<string, string>();

  // Common abbreviations and shortcuts
  const shortcuts: [string, string][] = [
    ['Maximum Life', 'Use "maximum l" instead of full pattern'],
    ['Fire Resistance', 'Use "fire.*res" -> "fi.*r"'],
    ['Cold Resistance', 'Use "cold.*res" -> "co.*r"'],
    ['Lightning Resistance', 'Use "lightning.*res" -> "li.*r"'],
    ['Movement Speed', 'Use specific % tier (30, 25, 20, etc.)'],
  ];

  for (const modName of modNames) {
    for (const [pattern, suggestion] of shortcuts) {
      if (modName.includes(pattern)) {
        suggestions.set(modName, suggestion);
      }
    }
  }

  return suggestions;
}
