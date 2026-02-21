"use client";

import Link from "next/link";
import { Dispatch, FormEvent, SetStateAction, useMemo, useState } from "react";
import {
  Frequency,
  Practice,
  WEEKDAY_OPTIONS,
  clamp,
  frequencyLabel,
  makeId,
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

function AddPracticeForm({
  draft,
  setDraft,
  onSubmit,
}: {
  draft: PracticeDraft;
  setDraft: Dispatch<SetStateAction<PracticeDraft>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="settings-form" onSubmit={onSubmit}>
      <div>
        <label className="field-label" htmlFor="title-new">
          Name
        </label>
        <input
          id="title-new"
          className="field-input"
          maxLength={90}
          value={draft.title}
          onChange={(event) => {
            setDraft((current) => ({ ...current, title: event.target.value }));
          }}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="frequency-new">
          Frequency
        </label>
        <select
          id="frequency-new"
          className="field-input"
          value={draft.frequency}
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              frequency: event.target.value as Frequency,
            }));
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
          <label className="field-label" htmlFor="weekday-new">
            Weekday
          </label>
          <select
            id="weekday-new"
            className="field-input"
            value={draft.weeklyDay}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                weeklyDay: Number(event.target.value),
              }));
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
          <label className="field-label" htmlFor="monthday-new">
            Day
          </label>
          <input
            id="monthday-new"
            className="field-input"
            type="number"
            min={1}
            max={31}
            value={draft.monthlyDay}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                monthlyDay: Number(event.target.value),
              }));
            }}
          />
        </div>
      ) : null}

      {draft.frequency === "interval" ? (
        <div>
          <label className="field-label" htmlFor="interval-new">
            Days
          </label>
          <input
            id="interval-new"
            className="field-input"
            type="number"
            min={1}
            max={365}
            value={draft.intervalDays}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                intervalDays: Number(event.target.value),
              }));
            }}
          />
        </div>
      ) : null}

      <button type="submit" className="solid-btn">
        Add
      </button>
    </form>
  );
}

function EditPracticeForm({
  draft,
  setDraft,
  onSave,
  onCancel,
}: {
  draft: PracticeDraft;
  setDraft: Dispatch<SetStateAction<PracticeDraft | null>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="edit-box">
      <div>
        <label className="field-label" htmlFor="title-edit">
          Name
        </label>
        <input
          id="title-edit"
          className="field-input"
          value={draft.title}
          maxLength={90}
          onChange={(event) => {
            setDraft((current) =>
              current
                ? {
                    ...current,
                    title: event.target.value,
                  }
                : current,
            );
          }}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="frequency-edit">
          Frequency
        </label>
        <select
          id="frequency-edit"
          className="field-input"
          value={draft.frequency}
          onChange={(event) => {
            setDraft((current) =>
              current
                ? {
                    ...current,
                    frequency: event.target.value as Frequency,
                  }
                : current,
            );
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
          <label className="field-label" htmlFor="weekday-edit">
            Weekday
          </label>
          <select
            id="weekday-edit"
            className="field-input"
            value={draft.weeklyDay}
            onChange={(event) => {
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      weeklyDay: Number(event.target.value),
                    }
                  : current,
              );
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
          <label className="field-label" htmlFor="monthday-edit">
            Day
          </label>
          <input
            id="monthday-edit"
            className="field-input"
            type="number"
            min={1}
            max={31}
            value={draft.monthlyDay}
            onChange={(event) => {
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      monthlyDay: Number(event.target.value),
                    }
                  : current,
              );
            }}
          />
        </div>
      ) : null}

      {draft.frequency === "interval" ? (
        <div>
          <label className="field-label" htmlFor="interval-edit">
            Days
          </label>
          <input
            id="interval-edit"
            className="field-input"
            type="number"
            min={1}
            max={365}
            value={draft.intervalDays}
            onChange={(event) => {
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      intervalDays: Number(event.target.value),
                    }
                  : current,
              );
            }}
          />
        </div>
      ) : null}

      <div className="row-actions">
        <button type="button" className="solid-btn" onClick={onSave}>
          Save
        </button>
        <button type="button" className="ghost-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const dayOfMonth = useMemo(() => Number(todayKey.split("-")[2] ?? "1"), [todayKey]);

  const {
    isLoaded,
    practices,
    setPractices,
    setCompletionByDate,
  } = useSanctaState();

  const [newDraft, setNewDraft] = useState<PracticeDraft>(() => makeDefaultDraft(dayOfMonth));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PracticeDraft | null>(null);

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
  }

  function startEditing(practice: Practice): void {
    setEditingId(practice.id);
    setEditDraft(draftFromPractice(practice));
  }

  function cancelEditing(): void {
    setEditingId(null);
    setEditDraft(null);
  }

  function saveEditing(practiceId: string): void {
    if (!editDraft) {
      return;
    }

    const trimmedTitle = editDraft.title.trim();
    if (!trimmedTitle) {
      return;
    }

    setPractices((current) =>
      current.map((practice) => {
        if (practice.id !== practiceId) {
          return practice;
        }

        return applyDraft(practice, {
          ...editDraft,
          title: trimmedTitle,
        });
      }),
    );

    cancelEditing();
  }

  function removePractice(practice: Practice): void {
    setPractices((current) => current.filter((entry) => entry.id !== practice.id));
    setCompletionByDate((current) => removePracticeFromCompletion(current, practice.id));

    if (editingId === practice.id) {
      cancelEditing();
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
          <h1 className="brand-title">Settings</h1>

          <nav className="tabs" aria-label="Primary">
            <Link href="/" className="tab">
              Today
            </Link>
            <Link href="/settings" className="tab is-active">
              Settings
            </Link>
          </nav>
        </header>

        <section className="settings-grid">
          <article className="card">
            <h2>Add</h2>
            <AddPracticeForm draft={newDraft} setDraft={setNewDraft} onSubmit={handleAddPractice} />
          </article>

          <article className="card">
            <h2>Practices</h2>

            {sortedPractices.length === 0 ? (
              <p className="empty">No tasks.</p>
            ) : (
              <ul className="list-clean">
                {sortedPractices.map((practice) => {
                  const isEditing = editingId === practice.id && Boolean(editDraft);

                  return (
                    <li key={practice.id} className="settings-row">
                      {isEditing && editDraft ? (
                        <EditPracticeForm
                          draft={editDraft}
                          setDraft={setEditDraft}
                          onSave={() => saveEditing(practice.id)}
                          onCancel={cancelEditing}
                        />
                      ) : (
                        <>
                          <div>
                            <h3>{practice.title}</h3>
                            <p className="small-note">{frequencyLabel(practice)}</p>
                          </div>

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
                              onClick={() => removePractice(practice)}
                            >
                              Remove
                            </button>
                          </div>
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
