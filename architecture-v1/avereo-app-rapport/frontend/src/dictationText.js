// Append to the latest field value without replacing manual input or exceeding its limit.
export function appendDictation(value, transcript, maxLength = Infinity) {
  const before = String(value || '');
  const spoken = String(transcript || '').trim();
  if (!spoken || before.length >= maxLength) return before;
  const separator = before && !/\s$/.test(before) ? ' ' : '';
  return `${before}${separator}${spoken} `.slice(0, maxLength);
}
