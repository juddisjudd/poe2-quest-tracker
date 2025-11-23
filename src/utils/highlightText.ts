/**
 * Highlight utility for quest text
 * Highlights numeric values, warnings, tips, and other special text
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

  const patterns = [
    { regex: /([+\-]\d+%?)/g, className: 'highlight-value' },
    { regex: /(\b\d+%?\b)/g, className: 'highlight-number' },
    { regex: /(WARNING:|PERMANENT|Permanent choice|cannot be changed|can't be changed)/gi, className: 'highlight-warning' },
    { regex: /(Tip:|Note:|Hint:|TIP:|NOTE:|HINT:)/gi, className: 'highlight-tip' },
    { regex: /\b(Spirit|Resistance|Life|Mana|Passive Skill Points?|Ascendancy|Trial)\b/g, className: 'highlight-keyword' },
  ];

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

  allMatches.sort((a, b) => a.start - b.start);

  const filteredMatches: Match[] = [];
  let lastEnd = -1;

  for (const match of allMatches) {
    if (match.start >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.end;
    }
  }

  filteredMatches.forEach((match) => {
    if (match.start > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.start),
      });
    }

    segments.push({
      text: match.text,
      className: match.className,
    });

    lastIndex = match.end;
  });

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

  result = result.replace(
    /(WARNING:|PERMANENT|Permanent choice|cannot be changed|can't be changed)/gi,
    '<span class="highlight-warning">$1</span>'
  );

  result = result.replace(
    /(Tip:|Note:|Hint:|TIP:|NOTE:|HINT:)/gi,
    '<span class="highlight-tip">$1</span>'
  );

  result = result.replace(
    /([+\-]\d+%?)/g,
    '<span class="highlight-value">$1</span>'
  );

  result = result.replace(
    /\b(Spirit|Resistance|Life|Mana|Passive Skill Points?|Ascendancy|Trial)\b/g,
    '<span class="highlight-keyword">$1</span>'
  );

  result = result.replace(
    /(\b\d+%?\b)/g,
    '<span class="highlight-number">$1</span>'
  );

  return result;
}
