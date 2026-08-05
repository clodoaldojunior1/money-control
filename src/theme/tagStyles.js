// Maps the prototype's tag-accent / tag-accent-2 / tag-neutral / tag-outline
// chip variants onto the current theme's tokens.

export function tagSx(kind, tokens) {
  switch (kind) {
    case "accent":
      return { backgroundColor: tokens.accentRamp[100], color: tokens.accentRamp[800] };
    case "accent2":
      return { backgroundColor: tokens.accent2Ramp[100], color: tokens.accent2Ramp[800] };
    case "outline":
      return { backgroundColor: "transparent", color: tokens.accent, border: `1px solid ${tokens.accent}` };
    case "neutral":
    default:
      return { backgroundColor: tokens.neutral[100], color: tokens.neutral[800] };
  }
}
