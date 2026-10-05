import { PALETTES, type CharacterAppearance } from "@/domain/character";

export function CharacterPortrait({
  character,
  size = 168,
}: {
  character: CharacterAppearance;
  size?: number;
}) {
  const palette = PALETTES[character.palette];
  const shoulder = character.silhouette === "coat" ? 78 : character.silhouette === "crop" ? 52 : 64;
  const headY = character.silhouette === "crop" ? 78 : 86;
  const head = character.silhouette === "sharp" ? "rect" : "ellipse";

  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 200 230"
      role="img"
      aria-label="Your character"
      className="shrink-0"
    >
      <rect x="8" y="8" width="184" height="214" rx="28" fill={palette.bg} />
      <rect x="8" y="8" width="184" height="214" rx="28" fill="none" stroke={palette.line} strokeOpacity="0.45" />
      <path
        d={`M ${100 - shoulder} 210 C ${100 - shoulder + 10} 150, ${100 + shoulder - 10} 150, ${100 + shoulder} 210`}
        fill={palette.line}
        opacity="0.9"
      />
      {head === "rect" ? (
        <rect x="62" y={headY - 36} width="76" height="84" rx="8" fill={palette.fg} />
      ) : (
        <ellipse cx="100" cy={headY} rx="40" ry="46" fill={palette.fg} />
      )}
      {character.silhouette === "hood" ? (
        <path
          d="M58 96 C58 40 142 40 142 96"
          fill="none"
          stroke={palette.line}
          strokeWidth="8"
          strokeLinecap="round"
        />
      ) : null}
      {character.collar === "band" ? <rect x="78" y="132" width="44" height="10" rx="3" fill={palette.line} /> : null}
      {character.collar === "high" ? <path d="M74 128 L100 154 L126 128 L118 128 L100 146 L82 128 Z" fill={palette.line} /> : null}
      {character.collar === "scarf" ? (
        <path d="M70 136 C90 150 120 120 140 146" fill="none" stroke={palette.line} strokeWidth="8" strokeLinecap="round" />
      ) : null}
      {character.accent === "visor" ? (
        <rect x="68" y={headY - 8} width="64" height="12" rx="6" fill={palette.bg} opacity="0.85" />
      ) : null}
      {character.accent === "circuit" ? (
        <path d="M36 48 H70 M36 48 V78 M150 170 H176 M176 170 V140" fill="none" stroke={palette.line} strokeWidth="2" />
      ) : null}
      {character.accent === "clasp" ? <polygon points="100,148 108,160 100,172 92,160" fill={palette.line} /> : null}
      <circle cx="86" cy={headY - 4} r="2.5" fill={palette.bg} />
      <circle cx="114" cy={headY - 4} r="2.5" fill={palette.bg} />
    </svg>
  );
}
