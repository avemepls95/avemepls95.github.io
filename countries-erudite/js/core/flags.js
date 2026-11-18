const REGIONAL_INDICATOR_A = 0x1f1e6;

export function flagEmoji(countryId) {
  return String.fromCodePoint(...[...countryId.toUpperCase()].map(ch => REGIONAL_INDICATOR_A + ch.charCodeAt(0) - 65));
}
