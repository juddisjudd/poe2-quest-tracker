/**
 * POB Color Code Parser
 *
 * Parses Path of Building color codes in notes:
 * - ^xRRGGBB: Hex color (e.g., ^xFF0000 for red)
 * - ^N: Preset colors (0-9)
 */

// POB preset color codes
const POB_PRESET_COLORS: Record<string, string> = {
  '0': '#FFFFFF', // White (default)
  '1': '#FF5555', // Red
  '2': '#55FF55', // Green
  '3': '#5555FF', // Blue
  '4': '#FFFF55', // Yellow
  '5': '#55FFFF', // Cyan
  '6': '#FF55FF', // Magenta
  '7': '#FFFFFF', // White (reset)
  '8': '#AAAAAA', // Gray
  '9': '#DDDDDD', // Light gray
};

/**
 * Parse POB color codes and convert to HTML with spans
 */
export function parsePOBColorCodes(text: string): string {
  if (!text) return '';

  let result = '';
  let currentColor: string | null = null;
  let i = 0;

  while (i < text.length) {
    // Check for color code marker
    if (text[i] === '^' && i + 1 < text.length) {
      const nextChar = text[i + 1];

      // Check for hex color code: ^xRRGGBB
      if (nextChar === 'x' && i + 8 <= text.length) {
        const hexCode = text.substring(i + 2, i + 8);

        // Validate hex code
        if (/^[0-9A-Fa-f]{6}$/.test(hexCode)) {
          // Close previous color span if any
          if (currentColor !== null) {
            result += '</span>';
          }

          // Start new color span
          currentColor = `#${hexCode}`;
          result += `<span style="color: ${currentColor}">`;

          // Skip the color code
          i += 8;
          continue;
        }
      }

      // Check for preset color code: ^N (0-9)
      else if (/[0-9]/.test(nextChar)) {
        const colorCode = nextChar;

        // Close previous color span if any
        if (currentColor !== null) {
          result += '</span>';
        }

        // Start new color span (or reset to default)
        if (colorCode === '0' || colorCode === '7') {
          // White/reset - don't add span, just close previous
          currentColor = null;
        } else {
          currentColor = POB_PRESET_COLORS[colorCode] || null;
          if (currentColor) {
            result += `<span style="color: ${currentColor}">`;
          }
        }

        // Skip the color code
        i += 2;
        continue;
      }
    }

    // Regular character - add to result
    result += text[i];
    i++;
  }

  // Close any open color span at the end
  if (currentColor !== null) {
    result += '</span>';
  }

  return result;
}

/**
 * Strip color codes from text (get plain text)
 */
export function stripPOBColorCodes(text: string): string {
  if (!text) return '';

  return text
    .replace(/\^x[0-9A-Fa-f]{6}/g, '') // Remove hex color codes
    .replace(/\^[0-9]/g, ''); // Remove preset color codes
}

/**
 * Check if text contains POB color codes
 */
export function hasPOBColorCodes(text: string): boolean {
  if (!text) return false;

  return /\^x[0-9A-Fa-f]{6}|\^[0-9]/.test(text);
}
