"use client";

import { useState, useTransition } from "react";
import { CharacterPortrait } from "@/components/character-portrait";
import {
  ACCENTS,
  ARCHETYPES,
  COLLARS,
  PALETTES,
  SILHOUETTES,
  archetypeById,
  type CharacterAppearance,
} from "@/domain/character";
import { saveProfile } from "@/server/actions/profile";

export function CharacterEditor({
  displayName,
  rankTitle,
  rankLore,
  initial,
}: {
  displayName: string;
  rankTitle: string;
  rankLore: string;
  initial: CharacterAppearance;
}) {
  const [name, setName] = useState(displayName);
  const [character, setCharacter] = useState<CharacterAppearance>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const archetype = archetypeById(character.archetype);

  function set<K extends keyof CharacterAppearance>(key: K, value: CharacterAppearance[K]) {
    setCharacter((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[280px_1fr]">
      <div className="rounded-2xl border border-line bg-raise p-5">
        <CharacterPortrait character={character} size={220} />
        <h1 className="mt-4 text-2xl">{name || "Unnamed"}</h1>
        <p className="text-amber">{rankTitle}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{archetype.line}</p>
        <p className="mt-3 text-sm leading-6 text-muted">{rankLore}</p>
      </div>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          startTransition(async () => {
            const result = await saveProfile({ displayName: name, ...character });
            setMessage(result.ok ? "Saved." : result.error);
          });
        }}
      >
        <label className="block text-sm">
          Display name
          <input className="mt-1 w-full rounded-lg border border-line bg-sunken px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <Choice label="Archetype" value={character.archetype} options={ARCHETYPES.map((item) => ({ id: item.id, label: item.label }))} onChange={(value) => set("archetype", value as CharacterAppearance["archetype"])} />
        <Choice label="Palette" value={character.palette} options={Object.entries(PALETTES).map(([id, palette]) => ({ id, label: palette.name }))} onChange={(value) => set("palette", value as CharacterAppearance["palette"])} />
        <Choice label="Silhouette" value={character.silhouette} options={SILHOUETTES.map((item) => ({ id: item.id, label: item.label }))} onChange={(value) => set("silhouette", value as CharacterAppearance["silhouette"])} />
        <Choice label="Collar" value={character.collar} options={COLLARS.map((item) => ({ id: item.id, label: item.label }))} onChange={(value) => set("collar", value as CharacterAppearance["collar"])} />
        <Choice label="Accent" value={character.accent} options={ACCENTS.map((item) => ({ id: item.id, label: item.label }))} onChange={(value) => set("accent", value as CharacterAppearance["accent"])} />
        <button type="submit" disabled={pending} className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-sunken disabled:opacity-50">
          {pending ? "Saving…" : "Save character"}
        </button>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </form>
    </div>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-full border px-3 py-1 text-sm ${value === option.id ? "border-amber text-amber" : "border-line text-muted"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
