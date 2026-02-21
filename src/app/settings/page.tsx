"use client";

import Link from "next/link";
import { Dispatch, FormEvent, SetStateAction, useMemo, useState } from "react";
import {
  Frequency,
  Practice,
  WEEKDAY_OPTIONS,
  addDays,
  clamp,
  formatDateCompact,
  frequencyLabel,
  isDueOnDate,
  listDueOnDate,
  makeId,
  nextDueDate,
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
          Practice name
        </label>
        <input
          id="title-new"
          className="field-input"
          placeholder="Ex: Morning offering"
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
          <option value="weekdays">Weekdays (Mon-Fri)</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="interval">Every N days</option>
        </select>
      </div>

      {draft.frequency === "weekly" ? (
        <div>
          <label className="field-label" htmlFor="weekday-new">
            Day of week
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
            Day of month
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
            Repeat every (days)
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
        Add Practice
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
          Practice name
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
          <option value="weekdays">Weekdays (Mon-Fri)</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="interval">Every N days</option>
        </select>
      </div>

      {draft.frequency === "weekly" ? (
        <div>
          <label className="field-label" htmlFor="weekday-edit">
            Day of week
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
            Day of month
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
            Repeat every (days)
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

      <div className="edit-actions">
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
  const [statusMessage, setStatusMessage] = useState("");

  const sortedPractices = useMemo(() => {
    return [...practices].sort((a, b) => a.title.localeCompare(b.title));
  }, [practices]);

  const dueTodayCount = useMemo(() => {
    return listDueOnDate(practices, todayKey).length;
  }, [practices, todayKey]);

  function handleAddPractice(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const trimmedTitle = newDraft.title.trim();
    if (!trimmedTitle) {
      setStatusMessage("Please enter a practice name.");
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
    setStatusMessage(`Added \"${nextPractice.title}\".`);
  }

  function startEditing(practice: Practice): void {
    setEditingId(practice.id);
    setEditDraft(draftFromPractice(practice));
    setStatusMessage("");
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
      setStatusMessage("Practice name cannot be empty.");
      return;
    }

    let updatedTitle = "";

    setPractices((current) =>
      current.map((practice) => {
        if (practice.id !== practiceId) {
          return practice;
        }

        const patched = applyDraft(practice, {
          ...editDraft,
          title: trimmedTitle,
        });

        updatedTitle = patched.title;
        return patched;
      }),
    );

    setEditingId(null);
    setEditDraft(null);
    setStatusMessage(`Saved changes to \"${updatedTitle || "practice"}\".`);
  }

  function removePractice(practice: Practice): void {
    setPractices((current) => current.filter((entry) => entry.id !== practice.id));
    setCompletionByDate((current) => removePracticeFromCompletion(current, practice.id));

    if (editingId === practice.id) {
      cancelEditing();
    }

    setStatusMessage(`Removed \"${practice.title}\".`);
  }

  if (!isLoaded) {
    return (
      <div className="shell">
        <main className="layout loading-layout">
          <section className="card">
            <p>Loading settings...</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="aura aura-one" />
      <div className="aura aura-two" />

      <main className="layout">
        <header className="topbar enter">
          <div className="brand-block">
            <p className="brand-kicker">Catholic Rule of Life</p>
            <h1 className="brand-title">Practice Settings</h1>
          </div>

          <nav className="tabs" aria-label="Primary">
            <Link href="/" className="tab">
              Today
            </Link>
            <Link href="/settings" className="tab is-active">
              Settings
            </Link>
          </nav>
        </header>

        <section className="hero enter enter-delay-1">
          <div>
            <p className="hero-day">Build your own practice library</p>
            <p className="hero-line">
              Add, adjust, and remove practices here. The Today page stays focused and uncluttered.
            </p>
          </div>

          <div className="hero-stats" role="group" aria-label="Settings stats">
            <article className="stat-tile">
              <p className="stat-label">Practices</p>
              <p className="stat-value">{practices.length}</p>
            </article>
            <article className="stat-tile">
              <p className="stat-label">Due Today</p>
              <p className="stat-value">{dueTodayCount}</p>
            </article>
            <article className="stat-tile">
              <p className="stat-label">Auto-save</p>
              <p className="stat-value">On</p>
            </article>
          </div>
        </section>

        {statusMessage ? <p className="status-banner enter enter-delay-2">{statusMessage}</p> : null}

        <section className="settings-grid stagger">
          <article className="card settings-add-card">
            <h2>Add New Practice</h2>
            <p className="muted-small">Your practices are private and saved locally in this browser.</p>

            <AddPracticeForm draft={newDraft} setDraft={setNewDraft} onSubmit={handleAddPractice} />
          </article>

          <article className="card settings-list-card">
            <h2>Manage Practices</h2>

            {sortedPractices.length === 0 ? (
              <div className="empty-box">
                <p>No practices yet.</p>
                <p>Add your first one using the form.</p>
              </div>
            ) : (
              <ul className="list-clean">
                {sortedPractices.map((practice) => {
                  const dueNow = isDueOnDate(practice, todayKey);
                  const nextKey = nextDueDate(practice, dueNow ? addDays(todayKey, 1) : todayKey);
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
                            <p>{frequencyLabel(practice)}</p>
                            <p className="muted-small">
                              {dueNow ? "Due today" : `Next due ${formatDateCompact(nextKey)}`}
                            </p>
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
