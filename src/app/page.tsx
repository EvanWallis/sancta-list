"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Frequency = "daily" | "weekdays" | "weekly" | "monthly" | "interval";

type Practice = {
  id: string;
  title: string;
  frequency: Frequency;
  weeklyDay?: number;
  monthlyDay?: number;
  intervalDays?: number;
  startDateKey: string;
  createdAt: string;
};

type VerseQuote = {
  reference: string;
  text: string;
  dateKey: string;
  fetchedAt: string;
};

type StoredState = {
  practices: Practice[];
  completionByDate: Record<string, string[]>;
  quote?: VerseQuote;
};

const STORAGE_KEY = "sancta-list-v1";

const DOUAY_RHEIMS_REFERENCES = [
  "Matthew 5:8",
  "John 14:6",
  "Philippians 4:6",
  "Romans 12:12",
  "Psalm 118:24",
  "Psalm 22:1",
  "Luke 1:38",
  "Joshua 1:9",
  "Micah 6:8",
  "Hebrews 11:1",
  "1 Thessalonians 5:16",
  "2 Timothy 1:7",
  "Proverbs 3:5",
  "Ecclesiastes 3:1",
  "James 1:5",
  "Matthew 11:28",
  "Isaiah 41:10",
  "Galatians 5:22",
  "Romans 8:28",
  "John 15:5",
];

const FALLBACK_QUOTES: Array<Pick<VerseQuote, "reference" | "text">> = [
  {
    reference: "Matthew 5:8",
    text: "Blessed are the clean of heart: for they shall see God.",
  },
  {
    reference: "John 14:6",
    text: "Jesus saith to him: I am the way, and the truth, and the life.",
  },
  {
    reference: "Romans 12:12",
    text: "Rejoicing in hope, patient in tribulation, instant in prayer.",
  },
  {
    reference: "1 Thessalonians 5:17",
    text: "Pray without ceasing.",
  },
  {
    reference: "Proverbs 3:5",
    text: "Have confidence in the Lord with all thy heart, and lean not upon thy own prudence.",
  },
];

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}

function addDays(dateKey: string, count: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + count);
  return toDateKey(date);
}

function dayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, (month ?? 1) - 1, day ?? 1) / 86_400_000);
}

function formatDate(dateKey: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parseDateKey(dateKey));
}

function cleanQuoteText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isFrequency(value: unknown): value is Frequency {
  return ["daily", "weekdays", "weekly", "monthly", "interval"].includes(String(value));
}

function normalizePractice(raw: unknown): Practice | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Partial<Practice>;
  const title = typeof item.title === "string" ? item.title.trim() : "";
  if (!title || !isFrequency(item.frequency)) {
    return null;
  }

  const practice: Practice = {
    id: typeof item.id === "string" && item.id ? item.id : makeId(),
    title: title.slice(0, 90),
    frequency: item.frequency,
    startDateKey:
      typeof item.startDateKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.startDateKey)
        ? item.startDateKey
        : toDateKey(new Date()),
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
  };

  if (practice.frequency === "weekly") {
    practice.weeklyDay = clamp(Number(item.weeklyDay ?? 0), 0, 6);
  }

  if (practice.frequency === "monthly") {
    practice.monthlyDay = clamp(Number(item.monthlyDay ?? 1), 1, 31);
  }

  if (practice.frequency === "interval") {
    practice.intervalDays = clamp(Number(item.intervalDays ?? 3), 1, 365);
  }

  return practice;
}

function isDueOnDate(practice: Practice, dateKey: string): boolean {
  const date = parseDateKey(dateKey);

  if (practice.frequency === "daily") {
    return true;
  }

  if (practice.frequency === "weekdays") {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  }

  if (practice.frequency === "weekly") {
    return date.getDay() === (practice.weeklyDay ?? 0);
  }

  if (practice.frequency === "monthly") {
    const targetDay = practice.monthlyDay ?? 1;
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return date.getDate() === Math.min(targetDay, lastDay);
  }

  const interval = practice.intervalDays ?? 1;
  const offset = dayNumber(dateKey) - dayNumber(practice.startDateKey);
  return offset >= 0 && offset % interval === 0;
}

function nextDueDate(practice: Practice, fromDateKey: string): string {
  let cursor = fromDateKey;

  for (let i = 0; i < 400; i += 1) {
    if (isDueOnDate(practice, cursor)) {
      return cursor;
    }

    cursor = addDays(cursor, 1);
  }

  return fromDateKey;
}

function frequencyLabel(practice: Practice): string {
  if (practice.frequency === "daily") {
    return "Daily";
  }

  if (practice.frequency === "weekdays") {
    return "Weekdays (Mon-Fri)";
  }

  if (practice.frequency === "weekly") {
    const label = WEEKDAY_OPTIONS.find((option) => option.value === practice.weeklyDay)?.label;
    return `Weekly on ${label ?? "Sunday"}`;
  }

  if (practice.frequency === "monthly") {
    return `Monthly on day ${practice.monthlyDay ?? 1}`;
  }

  return `Every ${practice.intervalDays ?? 1} day${(practice.intervalDays ?? 1) === 1 ? "" : "s"}`;
}

function isValidQuote(raw: unknown): raw is VerseQuote {
  if (!raw || typeof raw !== "object") {
    return false;
  }

  const item = raw as Partial<VerseQuote>;
  return (
    typeof item.reference === "string" &&
    typeof item.text === "string" &&
    typeof item.dateKey === "string" &&
    typeof item.fetchedAt === "string"
  );
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

export default function Home() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [isLoaded, setIsLoaded] = useState(false);

  const [titleDraft, setTitleDraft] = useState("");
  const [frequencyDraft, setFrequencyDraft] = useState<Frequency>("daily");
  const [weeklyDayDraft, setWeeklyDayDraft] = useState(0);
  const [monthlyDayDraft, setMonthlyDayDraft] = useState(new Date().getDate());
  const [intervalDaysDraft, setIntervalDaysDraft] = useState(3);

  const [practices, setPractices] = useState<Practice[]>([]);
  const [completionByDate, setCompletionByDate] = useState<Record<string, string[]>>({});

  const [quote, setQuote] = useState<VerseQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const [statusMessage, setStatusMessage] = useState("");

  const completedTodaySet = useMemo(() => {
    return new Set(completionByDate[todayKey] ?? []);
  }, [completionByDate, todayKey]);

  const dueToday = useMemo(() => {
    return [...practices]
      .filter((practice) => isDueOnDate(practice, todayKey))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [practices, todayKey]);

  const completedCount = useMemo(() => {
    return dueToday.filter((practice) => completedTodaySet.has(practice.id)).length;
  }, [completedTodaySet, dueToday]);

  const progressPercent = dueToday.length
    ? Math.round((completedCount / dueToday.length) * 100)
    : 0;

  const libraryRows = useMemo(() => {
    return [...practices]
      .map((practice) => {
        const dueNow = isDueOnDate(practice, todayKey);
        const fromDateKey = dueNow ? addDays(todayKey, 1) : todayKey;
        return {
          ...practice,
          dueNow,
          nextDueDateKey: nextDueDate(practice, fromDateKey),
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [practices, todayKey]);

  const pickReference = useCallback(
    (exclude?: string) => {
      const pool = DOUAY_RHEIMS_REFERENCES.filter((reference) => reference !== exclude);
      if (!pool.length) {
        return DOUAY_RHEIMS_REFERENCES[0] as string;
      }

      return randomItem(pool);
    },
    [],
  );

  const fetchQuote = useCallback(
    async (forceNew = false) => {
      const reference = pickReference(forceNew ? quote?.reference : undefined);
      setQuoteLoading(true);
      setQuoteError("");

      try {
        const response = await fetch(
          `https://bible-api.com/${encodeURIComponent(reference)}?translation=dra`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Quote API returned an error response.");
        }

        const payload = (await response.json()) as { text?: string; reference?: string };
        const text = typeof payload.text === "string" ? cleanQuoteText(payload.text) : "";
        const resolvedReference =
          typeof payload.reference === "string" && payload.reference
            ? payload.reference
            : reference;

        if (!text) {
          throw new Error("Quote API returned no verse text.");
        }

        setQuote({
          reference: resolvedReference,
          text,
          dateKey: todayKey,
          fetchedAt: new Date().toISOString(),
        });
      } catch {
        const fallback = randomItem(
          FALLBACK_QUOTES.filter((item) => item.reference !== quote?.reference),
        );

        setQuote({
          reference: fallback.reference,
          text: fallback.text,
          dateKey: todayKey,
          fetchedAt: new Date().toISOString(),
        });
        setQuoteError(
          "The live verse service is unavailable right now. Showing a built-in Douay-Rheims verse.",
        );
      } finally {
        setQuoteLoading(false);
      }
    },
    [pickReference, quote?.reference, todayKey],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setIsLoaded(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<StoredState>;

      const loadedPractices = Array.isArray(parsed.practices)
        ? parsed.practices
            .map((entry) => normalizePractice(entry))
            .filter((entry): entry is Practice => Boolean(entry))
        : [];

      const validIds = new Set(loadedPractices.map((practice) => practice.id));
      const cleanedCompletionByDate: Record<string, string[]> = {};

      if (parsed.completionByDate && typeof parsed.completionByDate === "object") {
        Object.entries(parsed.completionByDate).forEach(([dateKey, ids]) => {
          if (!Array.isArray(ids) || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
            return;
          }

          const nextIds = ids.filter(
            (id): id is string => typeof id === "string" && validIds.has(id),
          );

          if (nextIds.length > 0) {
            cleanedCompletionByDate[dateKey] = nextIds;
          }
        });
      }

      setPractices(loadedPractices);
      setCompletionByDate(cleanedCompletionByDate);

      if (isValidQuote(parsed.quote)) {
        setQuote(parsed.quote);
      }
    } catch {
      setStatusMessage(
        "We could not read previous saved data, so a fresh list has been started.",
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const payload: StoredState = {
      practices,
      completionByDate,
      quote: quote ?? undefined,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [completionByDate, isLoaded, practices, quote]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!quote || quote.dateKey !== todayKey) {
      void fetchQuote();
    }
  }, [fetchQuote, isLoaded, quote, todayKey]);

  function resetScheduleFields(): void {
    setWeeklyDayDraft(0);
    setMonthlyDayDraft(new Date().getDate());
    setIntervalDaysDraft(3);
  }

  function handleAddPractice(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const title = titleDraft.trim();
    if (!title) {
      setStatusMessage("Please enter a practice name before adding.");
      return;
    }

    const next: Practice = {
      id: makeId(),
      title: title.slice(0, 90),
      frequency: frequencyDraft,
      startDateKey: todayKey,
      createdAt: new Date().toISOString(),
    };

    if (frequencyDraft === "weekly") {
      next.weeklyDay = clamp(weeklyDayDraft, 0, 6);
    }

    if (frequencyDraft === "monthly") {
      next.monthlyDay = clamp(monthlyDayDraft, 1, 31);
    }

    if (frequencyDraft === "interval") {
      next.intervalDays = clamp(intervalDaysDraft, 1, 365);
    }

    setPractices((current) => [next, ...current]);
    setTitleDraft("");
    setFrequencyDraft("daily");
    resetScheduleFields();
    setStatusMessage(`Added \"${next.title}\".`);
  }

  function toggleCompleted(practiceId: string): void {
    setCompletionByDate((current) => {
      const todayEntries = new Set(current[todayKey] ?? []);

      if (todayEntries.has(practiceId)) {
        todayEntries.delete(practiceId);
        setStatusMessage("Marked as not done for today.");
      } else {
        todayEntries.add(practiceId);
        setStatusMessage("Marked complete for today.");
      }

      const nextToday = [...todayEntries];

      if (nextToday.length === 0) {
        const rest = { ...current };
        delete rest[todayKey];
        return rest;
      }

      return {
        ...current,
        [todayKey]: nextToday,
      };
    });
  }

  function removePractice(practiceId: string): void {
    const existing = practices.find((practice) => practice.id === practiceId);
    if (!existing) {
      return;
    }

    setPractices((current) => current.filter((practice) => practice.id !== practiceId));

    setCompletionByDate((current) => {
      const next: Record<string, string[]> = {};

      Object.entries(current).forEach(([dateKey, ids]) => {
        const remaining = ids.filter((id) => id !== practiceId);
        if (remaining.length > 0) {
          next[dateKey] = remaining;
        }
      });

      return next;
    });

    setStatusMessage(`Removed \"${existing.title}\".`);
  }

  if (!isLoaded) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <section className="panel loading-panel">
            <p>Loading your practices...</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="glow glow-left" />
      <div className="glow glow-right" />

      <main className="app-main">
        <header className="hero-card">
          <p className="hero-kicker">Catholic Practice Planner</p>
          <h1 className="hero-title">Sancta List</h1>
          <p className="hero-subtitle">
            Keep your daily rule of life clear, simple, and prayerful.
          </p>

          <div className="hero-metrics">
            <article className="metric-card">
              <p className="metric-label">Today</p>
              <p className="metric-value">{formatDate(todayKey)}</p>
            </article>

            <article className="metric-card">
              <p className="metric-label">Completed</p>
              <p className="metric-value">
                {completedCount}/{dueToday.length}
              </p>
            </article>

            <article className="metric-card">
              <p className="metric-label">Progress</p>
              <p className="metric-value">{progressPercent}%</p>
            </article>
          </div>
        </header>

        {statusMessage ? <p className="status-message">{statusMessage}</p> : null}

        <div className="content-grid">
          <section className="panel">
            <h2 className="panel-title">Add Practice</h2>
            <form className="practice-form" onSubmit={handleAddPractice}>
              <div>
                <label className="control-label" htmlFor="practice-title">
                  Practice name
                </label>
                <input
                  id="practice-title"
                  className="control-input"
                  placeholder="Ex: Morning offering"
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  maxLength={90}
                />
              </div>

              <div>
                <label className="control-label" htmlFor="frequency">
                  How often
                </label>
                <select
                  id="frequency"
                  className="control-select"
                  value={frequencyDraft}
                  onChange={(event) => {
                    setFrequencyDraft(event.target.value as Frequency);
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays (Mon-Fri)</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="interval">Every N days</option>
                </select>
              </div>

              {frequencyDraft === "weekly" ? (
                <div>
                  <label className="control-label" htmlFor="weekly-day">
                    Day of week
                  </label>
                  <select
                    id="weekly-day"
                    className="control-select"
                    value={weeklyDayDraft}
                    onChange={(event) => setWeeklyDayDraft(Number(event.target.value))}
                  >
                    {WEEKDAY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {frequencyDraft === "monthly" ? (
                <div>
                  <label className="control-label" htmlFor="monthly-day">
                    Day of month
                  </label>
                  <input
                    id="monthly-day"
                    className="control-input"
                    type="number"
                    min={1}
                    max={31}
                    value={monthlyDayDraft}
                    onChange={(event) => setMonthlyDayDraft(Number(event.target.value))}
                  />
                </div>
              ) : null}

              {frequencyDraft === "interval" ? (
                <div>
                  <label className="control-label" htmlFor="interval-days">
                    Repeat every (days)
                  </label>
                  <input
                    id="interval-days"
                    className="control-input"
                    type="number"
                    min={1}
                    max={365}
                    value={intervalDaysDraft}
                    onChange={(event) => setIntervalDaysDraft(Number(event.target.value))}
                  />
                </div>
              ) : null}

              <button className="primary-button" type="submit">
                Add Practice
              </button>
            </form>
          </section>

          <section className="panel quote-panel">
            <h2 className="panel-title">Douay-Rheims Public Domain Bible</h2>
            <p className="quote-intro">Daily verse for prayer and focus.</p>

            <blockquote className="quote-text">
              {quoteLoading && !quote ? "Loading verse..." : quote?.text ?? "Loading verse..."}
            </blockquote>
            <p className="quote-reference">{quote?.reference ?? ""}</p>

            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                void fetchQuote(true);
              }}
              disabled={quoteLoading}
            >
              {quoteLoading ? "Refreshing..." : "New Verse"}
            </button>

            {quoteError ? <p className="quote-note">{quoteError}</p> : null}

            <p className="quote-source">
              Source: bible-api.com using the public-domain Douay-Rheims translation (`dra`).
            </p>
          </section>

          <section className="panel panel-span-2">
            <h2 className="panel-title">Today&apos;s Practices</h2>
            {dueToday.length === 0 ? (
              <p className="empty-state">No practices are due today yet.</p>
            ) : (
              <ul className="task-list">
                {dueToday.map((practice) => {
                  const done = completedTodaySet.has(practice.id);

                  return (
                    <li key={practice.id} className={`task-card${done ? " done" : ""}`}>
                      <div>
                        <h3 className="task-title">{practice.title}</h3>
                        <p className="task-frequency">{frequencyLabel(practice)}</p>
                      </div>

                      <button
                        className={done ? "done-button" : "primary-button"}
                        type="button"
                        onClick={() => toggleCompleted(practice.id)}
                      >
                        {done ? "Completed" : "Mark Done"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="panel panel-span-2">
            <h2 className="panel-title">Practice Library</h2>
            {libraryRows.length === 0 ? (
              <p className="empty-state">Your added practices will appear here.</p>
            ) : (
              <ul className="library-list">
                {libraryRows.map((practice) => (
                  <li key={practice.id} className="library-card">
                    <div>
                      <h3 className="task-title">{practice.title}</h3>
                      <p className="task-frequency">{frequencyLabel(practice)}</p>
                      <p className="next-due">
                        Next due: {practice.dueNow ? "today" : formatDate(practice.nextDueDateKey)}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="text-button"
                      onClick={() => removePractice(practice.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
