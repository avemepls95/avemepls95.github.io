export function normalize(s) {
  return s.toLowerCase().replaceAll('ё', 'е').replace(/[^\p{L}\p{N}]/gu, '');
}
