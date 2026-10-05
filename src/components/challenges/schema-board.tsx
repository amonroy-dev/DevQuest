"use client";

import { useState } from "react";
import type { SchemaDefinition } from "@/domain/challenges/schema";

type Column = { name: string; type: string; pk: boolean; unique: boolean };
type Table = { name: string; columns: Column[] };
type ForeignKey = { fromTable: string; fromColumn: string; toTable: string; toColumn: string };

const EMPTY_COLUMN = (): Column => ({ name: "id", type: "uuid", pk: true, unique: false });

export function SchemaBoard({
  definition,
  initial,
  pending,
  onSubmit,
}: {
  definition: SchemaDefinition;
  initial: { tables?: Table[]; foreignKeys?: ForeignKey[] } | null;
  pending: boolean;
  onSubmit: (answer: { tables: Table[]; foreignKeys: ForeignKey[] }) => void;
}) {
  const [tables, setTables] = useState<Table[]>(initial?.tables ?? []);
  const [foreignKeys, setForeignKeys] = useState<ForeignKey[]>(initial?.foreignKeys ?? []);
  const [draft, setDraft] = useState<ForeignKey>({ fromTable: "", fromColumn: "", toTable: "", toColumn: "" });

  function columnsFor(tableName: string) {
    return tables.find((table) => table.name === tableName)?.columns ?? [];
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ tables, foreignKeys });
      }}
    >
      <p className="text-sm text-muted">{definition.brief}</p>
      {tables.map((table, tableIndex) => (
        <fieldset key={`${table.name}-${tableIndex}`} className="rounded-xl border border-line p-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              aria-label="Table name"
              className="rounded-lg border border-line bg-sunken px-3 py-2 text-sm"
              value={table.name}
              onChange={(event) =>
                setTables((current) => current.map((item, index) => (index === tableIndex ? { ...item, name: event.target.value } : item)))
              }
            />
            <button
              type="button"
              className="text-xs text-muted"
              onClick={() => setTables((current) => current.filter((_, index) => index !== tableIndex))}
            >
              Remove table
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {table.columns.map((column, columnIndex) => (
              <div key={columnIndex} className="grid gap-2 md:grid-cols-[1fr_140px_auto_auto_auto]">
                <input
                  aria-label="Column name"
                  className="rounded-lg border border-line bg-sunken px-2 py-2 text-sm"
                  value={column.name}
                  onChange={(event) =>
                    setTables((current) =>
                      current.map((item, index) =>
                        index === tableIndex
                          ? {
                              ...item,
                              columns: item.columns.map((col, colIndex) =>
                                colIndex === columnIndex ? { ...col, name: event.target.value } : col,
                              ),
                            }
                          : item,
                      ),
                    )
                  }
                />
                <select
                  aria-label="Column type"
                  className="rounded-lg border border-line bg-sunken px-2 py-2 text-sm"
                  value={column.type}
                  onChange={(event) =>
                    setTables((current) =>
                      current.map((item, index) =>
                        index === tableIndex
                          ? {
                              ...item,
                              columns: item.columns.map((col, colIndex) =>
                                colIndex === columnIndex ? { ...col, type: event.target.value } : col,
                              ),
                            }
                          : item,
                      ),
                    )
                  }
                >
                  {definition.columnTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={column.pk}
                    onChange={(event) =>
                      setTables((current) =>
                        current.map((item, index) =>
                          index === tableIndex
                            ? {
                                ...item,
                                columns: item.columns.map((col, colIndex) =>
                                  colIndex === columnIndex ? { ...col, pk: event.target.checked } : col,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                  PK
                </label>
                <label className="flex items-center gap-1 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={column.unique}
                    onChange={(event) =>
                      setTables((current) =>
                        current.map((item, index) =>
                          index === tableIndex
                            ? {
                                ...item,
                                columns: item.columns.map((col, colIndex) =>
                                  colIndex === columnIndex ? { ...col, unique: event.target.checked } : col,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                  Unique
                </label>
                <button
                  type="button"
                  className="text-xs text-muted"
                  onClick={() =>
                    setTables((current) =>
                      current.map((item, index) =>
                        index === tableIndex ? { ...item, columns: item.columns.filter((_, colIndex) => colIndex !== columnIndex) } : item,
                      ),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 text-sm text-blue"
            onClick={() =>
              setTables((current) =>
                current.map((item, index) =>
                  index === tableIndex ? { ...item, columns: [...item.columns, { name: "", type: "text", pk: false, unique: false }] } : item,
                ),
              )
            }
          >
            Add column
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="rounded-lg border border-line px-3 py-2 text-sm"
        onClick={() => setTables((current) => [...current, { name: "table_name", columns: [EMPTY_COLUMN()] }])}
      >
        Add table
      </button>
      <div className="rounded-xl border border-line p-4">
        <h3 className="text-sm font-medium">Foreign keys</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          {(["fromTable", "fromColumn", "toTable", "toColumn"] as const).map((field) => (
            <label key={field} className="text-xs text-muted">
              {field}
              {field.endsWith("Table") ? (
                <select
                  className="mt-1 w-full rounded-lg border border-line bg-sunken px-2 py-2 text-sm text-ink"
                  value={draft[field]}
                  onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))}
                >
                  <option value="">Select</option>
                  {tables.map((table) => (
                    <option key={table.name}>{table.name}</option>
                  ))}
                </select>
              ) : (
                <select
                  className="mt-1 w-full rounded-lg border border-line bg-sunken px-2 py-2 text-sm text-ink"
                  value={draft[field]}
                  onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))}
                >
                  <option value="">Select</option>
                  {columnsFor(field === "fromColumn" ? draft.fromTable : draft.toTable).map((column) => (
                    <option key={column.name}>{column.name}</option>
                  ))}
                </select>
              )}
            </label>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-sm text-blue"
          onClick={() => {
            if (!draft.fromTable || !draft.fromColumn || !draft.toTable || !draft.toColumn) return;
            setForeignKeys((current) => [...current, draft]);
          }}
        >
          Add foreign key
        </button>
        <ul className="mt-3 space-y-1 text-sm">
          {foreignKeys.map((key, index) => (
            <li key={`${key.fromTable}.${key.fromColumn}-${index}`} className="flex justify-between gap-3">
              <span>
                {key.fromTable}.{key.fromColumn} → {key.toTable}.{key.toColumn}
              </span>
              <button type="button" className="text-xs text-muted" onClick={() => setForeignKeys((current) => current.filter((_, i) => i !== index))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button type="submit" disabled={pending} className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-sunken disabled:opacity-50">
        {pending ? "Scoring…" : "Submit the schema"}
      </button>
    </form>
  );
}
