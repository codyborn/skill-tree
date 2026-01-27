/**
 * Generates SVG pattern backgrounds for header nodes
 * Creates a repeating emoji pattern with two-tone effect and gradient overlay
 */

/**
 * Generate a data URI containing an SVG pattern for header node background
 * @param emoji - The emoji character to use in the pattern
 * @param baseColor - Hex color for the pattern (e.g., "#3b82f6")
 * @returns Data URI string for use in CSS background-image
 */
export function generateHeaderPattern(emoji: string, baseColor: string): string {
  // Parse the hex color to RGB
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Pattern configuration
  const patternSize = 40; // Size of each pattern cell
  const fontSize = 24; // Size of emoji
  const spacing = patternSize; // Spacing between emojis

  // Create SVG pattern
  const svg = `
    <svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Two-tone emoji pattern -->
        <pattern id="emoji-pattern" x="0" y="0" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse">
          <!-- First emoji at higher opacity -->
          <text x="0" y="${fontSize}" font-size="${fontSize}" opacity="0.35" fill="rgb(${r},${g},${b})">${emoji}</text>
          <!-- Second emoji at lower opacity (creates two-tone effect) -->
          <text x="${spacing / 2}" y="${fontSize + spacing / 2}" font-size="${fontSize}" opacity="0.20" fill="rgb(${r},${g},${b})">${emoji}</text>
        </pattern>

        <!-- Gradient overlay for depth effect -->
        <linearGradient id="gradient-overlay" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(${r},${g},${b});stop-opacity:0.3" />
          <stop offset="50%" style="stop-color:rgb(${r},${g},${b});stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:rgb(${r},${g},${b});stop-opacity:0.2" />
        </linearGradient>
      </defs>

      <!-- Base colored rectangle -->
      <rect width="200" height="80" fill="rgb(${r},${g},${b})" opacity="0.9"/>

      <!-- Emoji pattern layer -->
      <rect width="200" height="80" fill="url(#emoji-pattern)"/>

      <!-- Gradient overlay for shadow/depth effect -->
      <rect width="200" height="80" fill="url(#gradient-overlay)"/>
    </svg>
  `.trim();

  // Encode SVG as data URI
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');

  return `data:image/svg+xml,${encoded}`;
}

/**
 * Generate a simple gray pattern for header nodes with no completed children
 * @param emoji - The emoji character to use in the pattern
 * @returns Data URI string for use in CSS background-image
 */
export function generateGrayHeaderPattern(emoji: string): string {
  const patternSize = 40;
  const fontSize = 24;
  const spacing = patternSize;

  // Use a neutral gray color
  const grayColor = 'rgb(100, 100, 100)';

  const svg = `
    <svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="emoji-pattern-gray" x="0" y="0" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse">
          <text x="0" y="${fontSize}" font-size="${fontSize}" opacity="0.20" fill="${grayColor}">${emoji}</text>
          <text x="${spacing / 2}" y="${fontSize + spacing / 2}" font-size="${fontSize}" opacity="0.12" fill="${grayColor}">${emoji}</text>
        </pattern>
      </defs>

      <!-- Base gray rectangle -->
      <rect width="200" height="80" fill="${grayColor}" opacity="0.3"/>

      <!-- Emoji pattern layer -->
      <rect width="200" height="80" fill="url(#emoji-pattern-gray)"/>
    </svg>
  `.trim();

  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');

  return `data:image/svg+xml,${encoded}`;
}
