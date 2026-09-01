/**
 * Utility functions for parsing natural language voice weather commands.
 */

export function extractCityFromVoiceCommand(rawTranscript: string): string {
  if (!rawTranscript) return '';

  // Clean raw transcript: lowercase, remove trailing punctuation
  let text = rawTranscript
    .trim()
    .replace(/[?.!,;:]+$/g, '')
    .replace(/^[?.!,;:]+/g, '')
    .trim();

  // Common weather conversational prefixes
  const prefixPatterns = [
    /^(?:what(?:'s| is) the weather (?:like )?in)\s+/i,
    /^(?:what(?:'s| is) the weather for)\s+/i,
    /^(?:what(?:'s| is) the forecast (?:for|in))\s+/i,
    /^(?:what(?:'s| is) the temperature (?:in|of|at))\s+/i,
    /^(?:how(?:'s| is) the weather (?:like )?in)\s+/i,
    /^(?:how(?:'s| is) the weather for)\s+/i,
    /^(?:how(?:'s| is) the weather)\s+/i,
    /^(?:weather (?:in|for|of|at))\s+/i,
    /^(?:forecast (?:for|in|of))\s+/i,
    /^(?:show (?:me )?(?:the )?weather (?:for|in|of))\s+/i,
    /^(?:show (?:me )?(?:the )?forecast (?:for|in|of))\s+/i,
    /^(?:check (?:the )?weather (?:in|for|of))\s+/i,
    /^(?:temperature (?:in|of|at))\s+/i,
    /^(?:temp (?:in|of|at))\s+/i,
    /^(?:is it raining in)\s+/i,
    /^(?:is it sunny in)\s+/i,
    /^(?:is it cold in)\s+/i,
    /^(?:search (?:for )?(?:city )?)\s+/i,
    /^(?:look up (?:the )?weather (?:in|for))\s+/i,
    /^(?:find (?:weather (?:in|for)?)?)\s+/i,
  ];

  for (const pattern of prefixPatterns) {
    if (pattern.test(text)) {
      text = text.replace(pattern, '').trim();
      break;
    }
  }

  // Common weather conversational suffixes (e.g. "Hyderabad weather", "London forecast", "Tokyo temperature")
  const suffixPatterns = [
    /\s+(?:weather forecast|weather today|weather tomorrow|weather|forecast|temperature|temp|today|now)$/i,
  ];

  for (const pattern of suffixPatterns) {
    if (pattern.test(text)) {
      text = text.replace(pattern, '').trim();
      break;
    }
  }

  // Remove quotes or stray words like "city" or "today"
  text = text.replace(/^["']|["']$/g, '').trim();
  text = text.replace(/\s+city$/i, '').trim();

  // Capitalize words properly
  return text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
