export const ARCHETYPES = [
  {
    id: "vibe_coder",
    label: "Vibe Coder",
    line: "Ships with an agent. Learning the machinery underneath.",
  },
  {
    id: "architect",
    label: "Architect",
    line: "Draws the boxes before asking an agent to fill them in.",
  },
  {
    id: "debugger",
    label: "Debugger",
    line: "Reads the failure before reaching for a new prompt.",
  },
  {
    id: "incident_lead",
    label: "Incident Lead",
    line: "Treats production as the place the design gets tested.",
  },
  {
    id: "reviewer",
    label: "Reviewer",
    line: "Owns the decision the agent typed.",
  },
] as const;

export const PALETTES = {
  slate: { name: "Slate", bg: "#1c2430", fg: "#d5dde8", line: "#8ea0b5" },
  amber: { name: "Amber", bg: "#3a2a16", fg: "#f3ddb0", line: "#e2b15a" },
  emerald: { name: "Emerald", bg: "#13261f", fg: "#cfeedd", line: "#3dbe8b" },
  violet: { name: "Violet", bg: "#241933", fg: "#e4d6f8", line: "#b48cff" },
  cyan: { name: "Cyan", bg: "#10252c", fg: "#d4f4f8", line: "#5ad7e6" },
  rose: { name: "Rose", bg: "#2c1720", fg: "#f8d6e0", line: "#e07a9a" },
} as const;

export const SILHOUETTES = [
  { id: "hood", label: "Hood" },
  { id: "crop", label: "Crop" },
  { id: "coat", label: "Coat" },
  { id: "sharp", label: "Sharp" },
] as const;

export const COLLARS = [
  { id: "none", label: "None" },
  { id: "band", label: "Band" },
  { id: "high", label: "High" },
  { id: "scarf", label: "Scarf" },
] as const;

export const ACCENTS = [
  { id: "none", label: "None" },
  { id: "circuit", label: "Circuit" },
  { id: "visor", label: "Visor" },
  { id: "clasp", label: "Clasp" },
] as const;

export type ArchetypeId = (typeof ARCHETYPES)[number]["id"];
export type PaletteId = keyof typeof PALETTES;
export type SilhouetteId = (typeof SILHOUETTES)[number]["id"];
export type CollarId = (typeof COLLARS)[number]["id"];
export type AccentId = (typeof ACCENTS)[number]["id"];

export type CharacterAppearance = {
  archetype: ArchetypeId;
  palette: PaletteId;
  silhouette: SilhouetteId;
  collar: CollarId;
  accent: AccentId;
};

export const DEFAULT_CHARACTER: CharacterAppearance = {
  archetype: "vibe_coder",
  palette: "amber",
  silhouette: "hood",
  collar: "band",
  accent: "circuit",
};

export function archetypeById(id: string) {
  return ARCHETYPES.find((item) => item.id === id) ?? ARCHETYPES[0];
}

const ARCHETYPE_IDS = ARCHETYPES.map((item) => item.id);
const PALETTE_IDS = Object.keys(PALETTES);
const SILHOUETTE_IDS = SILHOUETTES.map((item) => item.id);
const COLLAR_IDS = COLLARS.map((item) => item.id);
const ACCENT_IDS = ACCENTS.map((item) => item.id);

export function isCharacterAppearance(value: {
  archetype: string;
  palette: string;
  silhouette: string;
  collar: string;
  accent: string;
}): value is CharacterAppearance {
  return (
    ARCHETYPE_IDS.includes(value.archetype as ArchetypeId) &&
    PALETTE_IDS.includes(value.palette) &&
    SILHOUETTE_IDS.includes(value.silhouette as SilhouetteId) &&
    COLLAR_IDS.includes(value.collar as CollarId) &&
    ACCENT_IDS.includes(value.accent as AccentId)
  );
}
