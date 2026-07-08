const PALETTE = ["blue", "sage", "gold", "coral"];

// Deterministic: same tagId always maps to the same color, without needing
// to store a color field on the tag or know its position in the list.
export function tagColorKey(tagId) {
  if (!tagId) return "blue";

  let hash = 0;
  for (let i = 0; i < tagId.length; i++) {
    hash = (hash * 31 + tagId.charCodeAt(i)) >>> 0;
  }

  return PALETTE[hash % PALETTE.length];
}
