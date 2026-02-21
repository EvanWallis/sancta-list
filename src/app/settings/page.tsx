"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  Frequency,
  Practice,
  SanctaState,
  WEEKDAY_OPTIONS,
  clamp,
  createExportPayload,
  frequencyLabel,
  makeId,
  parseImportPayload,
  removePracticeFromCompletion,
  toDateKey,
} from "@/lib/sancta";
import { useSanctaState } from "@/lib/useSanctaState";

type PracticeDraft = {
  title: string;
  frequency: Frequency;
  weeklyDay: number;
  monthlyDay: number;
  intervalDays: number;
};

type EditingState = {
  id: string;
  draft: PracticeDraft;
};

function makeDefaultDraft(dayOfMonth: number): PracticeDraft {
  return {
    title: "",
    frequency: "daily",
    weeklyDay: 1,
    monthlyDay: clamp(dayOfMonth, 1, 31),
    intervalDays: 3,
  };
}

function draftFromPractice(practice: Practice): PracticeDraft {
  return {
    title: practice.title,
    frequency: practice.frequency,
    weeklyDay: practice.weeklyDay ?? 1,
    monthlyDay: practice.monthlyDay ?? 1,
    intervalDays: practice.intervalDays ?? 3,
  };
}

function applyDraft(practice: Practice, draft: PracticeDraft): Practice {
  const next: Practice = {
    ...practice,
    title: draft.title.trim().slice(0, 90),
    frequency: draft.frequency,
    weeklyDay: undefined,
    monthlyDay: undefined,
    intervalDays: undefined,
  };

  if (draft.frequency === "weekly") {
    next.weeklyDay = clamp(draft.weeklyDay, 0, 6);
  }

  if (draft.frequency === "monthly") {
    next.monthlyDay = clamp(draft.monthlyDay, 1, 31);
  }

  if (draft.frequency === "interval") {
    next.intervalDays = clamp(draft.intervalDays, 1, 365);
  }

  return next;
}

function PracticeForm({
  idPrefix,
  draft,
  onDraftChange,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  idPrefix: string;
  draft: PracticeDraft;
  onDraftChange: (next: PracticeDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  onCancel?: () => void;
}) {
  return (
    <form className="settings-form" onSubmit={onSubmit}>
      <div>
        <label className="field-label" htmlFor={`${idPrefix}-name`}>
          Name
        </label>
        <input
          id={`${idPrefix}-name`}
          className="field-input"
          maxLength={90}
          value={draft.title}
          onChange={(event) => {
            onDraftChange({
              ...draft,
              title: event.target.value,
            });
          }}
        />
      </div>

      <div>
        <label className="field-label" htmlFor={`${idPrefix}-frequency`}>
          Frequency
        </label>
        <select
          id={`${idPrefix}-frequency`}
          className="field-input"
          value={draft.frequency}
          onChange={(event) => {
            onDraftChange({
              ...draft,
              frequency: event.target.value as Frequency,
            });
          }}
        >
          <option value="daily">Daily</option>
          <option value="weekdays">Weekdays</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="interval">Every N days</option>
        </select>
      </div>

      {draft.frequency === "weekly" ? (
        <div>
          <label className="field-label" htmlFor={`${idPrefix}-weekday`}>
            Weekday
          </label>
          <select
            id={`${idPrefix}-weekday`}
            className="field-input"
            value={draft.weeklyDay}
            onChange={(event) => {
              onDraftChange({
                ...draft,
                weeklyDay: Number(event.target.value),
              });
            }}
          >
            {WEEKDAY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {draft.frequency === "monthly" ? (
        <div>
          <label className="field-label" htmlFor={`${idPrefix}-monthday`}>
            Day
          </label>
          <input
            id={`${idPrefix}-monthday`}
            className="field-input"
            type="number"
            min={1}
            max={31}
            value={draft.monthlyDay}
            onChange={(event) => {
              onDraftChange({
                ...draft,
                monthlyDay: Number(event.target.value),
              });
            }}
          />
        </div>
      ) : null}

      {draft.frequency === "interval" ? (
        <div>
          <label className="field-label" htmlFor={`${idPrefix}-interval`}>
            Days
          </label>
          <input
            id={`${idPrefix}-interval`}
            className="field-input"
            type="number"
            min={1}
            max={365}
            value={draft.intervalDays}
            onChange={(event) => {
              onDraftChange({
                ...draft,
                intervalDays: Number(event.target.value),
              });
            }}
          />
        </div>
      ) : null}

      <div className="row-actions">
        <button type="submit" className="solid-btn">
          {submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="ghost-btn" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const dayOfMonth = useMemo(() => Number(todayKey.split("-")[2] ?? "1"), [todayKey]);

  const {
    isLoaded,
    practices,
    setPractices,
    completionByDate,
    setCompletionByDate,
    quote,
    setQuote,
  } = useSanctaState();

  const [newDraft, setNewDraft] = useState<PracticeDraft>(() => makeDefaultDraft(dayOfMonth));
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const sortedPractices = useMemo(() => {
    return [...practices].sort((a, b) => a.title.localeCompare(b.title));
  }, [practices]);

  function handleAddPractice(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const trimmedTitle = newDraft.title.trim();
    if (!trimmedTitle) {
      return;
    }

    const basePractice: Practice = {
      id: makeId(),
      title: trimmedTitle.slice(0, 90),
      frequency: newDraft.frequency,
      startDateKey: todayKey,
      createdAt: new Date().toISOString(),
    };

    const nextPractice = applyDraft(basePractice, newDraft);
    setPractices((current) => [nextPractice, ...current]);
    setNewDraft(makeDefaultDraft(dayOfMonth));
    setNotice("Added.");
  }

  function startEditing(practice: Practice): void {
    setEditing({ id: practice.id, draft: draftFromPractice(practice) });
    setPendingDeleteId(null);
    setNotice("");
  }

  function cancelEditing(): void {
    setEditing(null);
  }

  function saveEditing(event: FormEvent<HTMLFormElement>, practiceId: string): void {
    event.preventDefault();

    if (!editing || editing.id !== practiceId) {
      return;
    }

    const trimmedTitle = editing.draft.title.trim();
    if (!trimmedTitle) {
      return;
    }

    setPractices((current) =>
      current.map((practice) => {
        if (practice.id !== practiceId) {
          return practice;
        }

        return applyDraft(practice, {
          ...editing.draft,
          title: trimmedTitle,
        });
      }),
    );

    setEditing(null);
    setNotice("Saved.");
  }

  function removePractice(practice: Practice): void {
    setPractices((current) => current.filter((entry) => entry.id !== practice.id));
    setCompletionByDate((current) => removePracticeFromCompletion(current, practice.id));

    if (editing?.id === practice.id) {
      setEditing(null);
    }

    setPendingDeleteId(null);
    setNotice("Deleted.");
  }

  function downloadBackupFile(payload: SanctaState): void {
    const exportPayload = createExportPayload(payload);
    const fileBlob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(fileBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sancta-list-backup-${todayKey}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleExport(): void {
    downloadBackupFile({
      practices,
      completionByDate,
      quote: quote ?? undefined,
    });

    setNotice("Backup downloaded.");
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const imported = parseImportPayload(parsed);

      if (!imported) {
        setNotice("Invalid backup file.");
        return;
      }

      setPractices(imported.practices);
      setCompletionByDate(imported.completionByDate);
      setQuote(imported.quote ?? null);

      setEditing(null);
      setPendingDeleteId(null);
      setNewDraft(makeDefaultDraft(dayOfMonth));
      setNotice("Backup imported.");
    } catch {
      setNotice("Import failed.");
    }
  }

  if (!isLoaded) {
    return (
      <div className="shell">
        <main className="layout">
          <section className="card">
            <p>Loading...</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <main className="layout">
        <header className="topbar">
          <h1 className="brand-title">Index Sanctus</h1>

          <nav className="tabs" aria-label="Primary">
            <Link href="/" className="tab">
              Today
            </Link>
            <Link href="/settings" className="tab is-active">
              Settings
            </Link>
          </nav>
        </header>

        <section className="card">
          <div className="section-head">
            <h2>Backup</h2>
            <div className="row-actions">
              <button type="button" className="ghost-btn" onClick={handleExport}>
                Export
              </button>
              <label className="ghost-btn file-btn">
                Import
                <input
                  type="file"
                  accept="application/json"
                  className="file-input"
                  onChange={(event) => {
                    void handleImport(event);
                  }}
                />
              </label>
            </div>
          </div>
          {notice ? <p className="small-note">{notice}</p> : null}
        </section>

        <section className="settings-grid">
          <article className="card">
            <h2>Add</h2>
            <PracticeForm
              idPrefix="add"
              draft={newDraft}
              onDraftChange={setNewDraft}
              onSubmit={handleAddPractice}
              submitLabel="Add"
            />
          </article>

          <article className="card">
            <h2>Practices</h2>

            {sortedPractices.length === 0 ? (
              <p className="empty">No tasks.</p>
            ) : (
              <ul className="list-clean">
                {sortedPractices.map((practice) => {
                  const isEditing = editing?.id === practice.id;
                  const isConfirmingDelete = pendingDeleteId === practice.id;

                  return (
                    <li key={practice.id} className="settings-row">
                      {isEditing && editing ? (
                        <PracticeForm
                          idPrefix={`edit-${practice.id}`}
                          draft={editing.draft}
                          onDraftChange={(next) => {
                            setEditing((current) =>
                              current && current.id === practice.id
                                ? {
                                    ...current,
                                    draft: next,
                                  }
                                : current,
                            );
                          }}
                          onSubmit={(event) => saveEditing(event, practice.id)}
                          submitLabel="Save"
                          onCancel={cancelEditing}
                        />
                      ) : (
                        <>
                          <div>
                            <h3>{practice.title}</h3>
                            <p className="small-note">{frequencyLabel(practice)}</p>
                          </div>

                          {isConfirmingDelete ? (
                            <div className="row-actions confirm-actions">
                              <button
                                type="button"
                                className="danger-btn"
                                onClick={() => removePractice(practice)}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="ghost-btn"
                                onClick={() => setPendingDeleteId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="row-actions">
                              <button
                                type="button"
                                className="ghost-btn"
                                onClick={() => startEditing(practice)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="danger-btn"
                                onClick={() => setPendingDeleteId(practice.id)}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
