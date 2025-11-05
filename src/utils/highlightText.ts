/**
 * Highlight utility for quest text
 * Highlights numeric values, warnings, tips, and other special text
 * Inspired by XileHUD's highlighting system
 */

export interface HighlightedSegment {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Parse text and return segments with highlighting information
 * @param text - The text to highlight
 * @returns Array of text segments with optional styling
 */
export function highlightQuestText(text: string): HighlightedSegment[] {
  if (!text) return [{ text: '' }];

  const segments: HighlightedSegment[] = [];
  let lastIndex = 0;

  // Combined regex for all patterns we want to highlight
  const patterns = [
    // Numeric values with signs: +30, -5, +10%, -20%
    { regex: /([+\-]\d+%?)/g, className: 'highlight-value' },
    // Standalone numbers with context: 30 spirit, 10 resistance
    { regex: /(\b\d+%?\b)/g, className: 'highlight-number' },
    // Warning text
    { regex: /(WARNING:|PERMANENT|Permanent choice|cannot be changed|can't be changed)/gi, className: 'highlight-warning' },
    // Tip/Note text
    { regex: /(Tip:|Note:|Hint:|TIP:|NOTE:|HINT:)/gi, className: 'highlight-tip' },
    // Important keywords
    { regex: /\b(Spirit|Resistance|Life|Mana|Passive Skill Points?|Ascendancy|Trial)\b/g, className: 'highlight-keyword' },
  ];

  // Create a map of all matches with their positions
  interface Match {
    start: number;
    end: number;
    text: string;
    className: string;
  }

  const allMatches: Match[] = [];

  patterns.forEach(({ regex, className }) => {
    const matches = text.matchAll(regex);
    for (const match of matches) {
      if (match.index !== undefined) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          className,
        });
      }
    }
  });

  // Sort matches by start position
  allMatches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (keep the first one)
  const filteredMatches: Match[] = [];
  let lastEnd = -1;

  for (const match of allMatches) {
    if (match.start >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.end;
    }
  }

  // Build segments
  filteredMatches.forEach((match) => {
    // Add text before the match
    if (match.start > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.start),
      });
    }

    // Add the highlighted match
    segments.push({
      text: match.text,
      className: match.className,
    });

    lastIndex = match.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
    });
  }

  return segments.length > 0 ? segments : [{ text }];
}

/**
 * Simple version that returns HTML string
 * @param text - The text to highlight
 * @returns HTML string with span elements for highlights
 */
export function highlightQuestTextHTML(text: string): string {
  if (!text) return '';

  let result = text;

  // Apply highlights in order (most specific first)

  // 1. Warnings
  result = result.replace(
    /(WARNING:|PERMANENT|Permanent choice|cannot be changed|can't be changed)/gi,
    '<span class="highlight-warning">$1</span>'
  );

  // 2. Tips
  result = result.replace(
    /(Tip:|Note:|Hint:|TIP:|NOTE:|HINT:)/gi,
    '<span class="highlight-tip">$1</span>'
  );

  // 3. Numeric values with signs
  result = result.replace(
    /([+\-]\d+%?)/g,
    '<span class="highlight-value">$1</span>'
  );

  // 4. Keywords
  result = result.replace(
    /\b(Spirit|Resistance|Life|Mana|Passive Skill Points?|Ascendancy|Trial)\b/g,
    '<span class="highlight-keyword">$1</span>'
  );

  // 5. Standalone numbers
  result = result.replace(
    /(\b\d+%?\b)/g,
    '<span class="highlight-number">$1</span>'
  );

  return result;
}
