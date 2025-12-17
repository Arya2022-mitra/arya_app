/**
 * Utility to clean markdown formatting from text for display
 * Removes markdown syntax while preserving the actual content
 */

export function cleanMarkdownForDisplay(text: string): string {
  if (!text) return '';
  
  // For display purposes, we want to remove markdown syntax but keep structure
  return text
    // Remove markdown headers but keep the text
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    // Convert bold/italic to plain text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove remaining standalone symbols at word boundaries
    .replace(/(?:^|\s)([*_#]+)(?:\s|$)/g, ' ')
    .trim();
}
