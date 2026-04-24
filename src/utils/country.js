export function flagEmojiFromISO(code) {
  if (!code) return "🏳️";

  return code
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt())
    );
}