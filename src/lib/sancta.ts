export type Frequency = "daily" | "weekdays" | "weekly" | "monthly" | "interval";

export type Practice = {
  id: string;
  title: string;
  frequency: Frequency;
  weeklyDay?: number;
  monthlyDay?: number;
  intervalDays?: number;
  startDateKey: string;
  createdAt: string;
};

export type VerseQuote = {
  reference: string;
  text: string;
  dateKey: string;
  fetchedAt: string;
};

export type CompletionByDate = Record<string, string[]>;

export type SanctaState = {
  practices: Practice[];
  completionByDate: CompletionByDate;
  quote?: VerseQuote;
};

export type QuoteResult = {
  quote: VerseQuote;
  warning?: string;
};

export const STORAGE_KEY = "sancta-list-v1";

export const WEEKDAY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

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
] as const;

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

const EMPTY_STATE: SanctaState = {
  practices: [],
  completionByDate: {},
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && DATE_KEY_PATTERN.test(value);
}

function isFrequency(value: unknown): value is Frequency {
  return ["daily", "weekdays", "weekly", "monthly", "interval"].includes(String(value));
}

function isQuote(raw: unknown): raw is VerseQuote {
  if (!raw || typeof raw !== "object") {
    return false;
  }

  const value = raw as Partial<VerseQuote>;
  return (
    typeof value.reference === "string" &&
    typeof value.text === "string" &&
    isDateKey(value.dateKey) &&
    typeof value.fetchedAt === "string"
  );
}

export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}

export function addDays(dateKey: string, count: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + count);
  return toDateKey(date);
}

export function dayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, (month ?? 1) - 1, day ?? 1) / 86_400_000);
}

export function formatDateLabel(dateKey: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parseDateKey(dateKey));
}

export function formatDateCompact(dateKey: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parseDateKey(dateKey));
}

export function cleanQuoteText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function normalizePractice(raw: unknown): Practice | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Partial<Practice>;
  const title = typeof item.title === "string" ? item.title.trim() : "";

  if (!title || !isFrequency(item.frequency)) {
    return null;
  }

  const normalized: Practice = {
    id: typeof item.id === "string" && item.id ? item.id : makeId(),
    title: title.slice(0, 90),
    frequency: item.frequency,
    startDateKey: isDateKey(item.startDateKey) ? item.startDateKey : toDateKey(new Date()),
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
  };

  if (normalized.frequency === "weekly") {
    normalized.weeklyDay = clamp(Number(item.weeklyDay ?? 0), 0, 6);
  }

  if (normalized.frequency === "monthly") {
    normalized.monthlyDay = clamp(Number(item.monthlyDay ?? 1), 1, 31);
  }

  if (normalized.frequency === "interval") {
    normalized.intervalDays = clamp(Number(item.intervalDays ?? 3), 1, 365);
  }

  return normalized;
}

export function normalizeState(raw: unknown): SanctaState {
  if (!raw || typeof raw !== "object") {
    return EMPTY_STATE;
  }

  const parsed = raw as Partial<SanctaState>;

  const practices = Array.isArray(parsed.practices)
    ? parsed.practices
        .map((entry) => normalizePractice(entry))
        .filter((entry): entry is Practice => Boolean(entry))
    : [];

  const validIds = new Set(practices.map((practice) => practice.id));
  const completionByDate: CompletionByDate = {};

  if (parsed.completionByDate && typeof parsed.completionByDate === "object") {
    Object.entries(parsed.completionByDate).forEach(([dateKey, ids]) => {
      if (!isDateKey(dateKey) || !Array.isArray(ids)) {
        return;
      }

      const cleanIds = ids.filter((id): id is string => typeof id === "string" && validIds.has(id));
      if (cleanIds.length > 0) {
        completionByDate[dateKey] = cleanIds;
      }
    });
  }

  return {
    practices,
    completionByDate,
    quote: isQuote(parsed.quote) ? parsed.quote : undefined,
  };
}

export function readState(): SanctaState {
  if (typeof window === "undefined") {
    return EMPTY_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_STATE;
    }

    return normalizeState(JSON.parse(raw));
  } catch {
    return EMPTY_STATE;
  }
}

export function writeState(state: SanctaState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isDueOnDate(practice: Practice, dateKey: string): boolean {
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

export function listDueOnDate(practices: Practice[], dateKey: string): Practice[] {
  return practices.filter((practice) => isDueOnDate(practice, dateKey));
}

export function nextDueDate(practice: Practice, fromDateKey: string): string {
  let cursor = fromDateKey;

  for (let i = 0; i < 400; i += 1) {
    if (isDueOnDate(practice, cursor)) {
      return cursor;
    }

    cursor = addDays(cursor, 1);
  }

  return fromDateKey;
}

export function frequencyLabel(practice: Practice): string {
  if (practice.frequency === "daily") {
    return "Daily";
  }

  if (practice.frequency === "weekdays") {
    return "Weekdays (Mon-Fri)";
  }

  if (practice.frequency === "weekly") {
    const label = WEEKDAY_OPTIONS.find((entry) => entry.value === practice.weeklyDay)?.label;
    return `Weekly on ${label ?? "Sunday"}`;
  }

  if (practice.frequency === "monthly") {
    return `Monthly on day ${practice.monthlyDay ?? 1}`;
  }

  const interval = practice.intervalDays ?? 1;
  return `Every ${interval} day${interval === 1 ? "" : "s"}`;
}

export function toggleCompleted(
  completionByDate: CompletionByDate,
  dateKey: string,
  practiceId: string,
): CompletionByDate {
  const next = { ...completionByDate };
  const set = new Set(next[dateKey] ?? []);

  if (set.has(practiceId)) {
    set.delete(practiceId);
  } else {
    set.add(practiceId);
  }

  const nextIds = [...set];
  if (nextIds.length === 0) {
    delete next[dateKey];
  } else {
    next[dateKey] = nextIds;
  }

  return next;
}

export function removePracticeFromCompletion(
  completionByDate: CompletionByDate,
  practiceId: string,
): CompletionByDate {
  const next: CompletionByDate = {};

  Object.entries(completionByDate).forEach(([dateKey, ids]) => {
    const remaining = ids.filter((id) => id !== practiceId);
    if (remaining.length > 0) {
      next[dateKey] = remaining;
    }
  });

  return next;
}

export async function fetchDouayRheimsQuote(
  dateKey: string,
  currentReference?: string,
): Promise<QuoteResult> {
  const referencePool = DOUAY_RHEIMS_REFERENCES.filter((reference) => reference !== currentReference);
  const reference = randomItem(referencePool.length > 0 ? referencePool : DOUAY_RHEIMS_REFERENCES);

  try {
    const response = await fetch(
      `https://bible-api.com/${encodeURIComponent(reference)}?translation=dra`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("API response was not OK");
    }

    const payload = (await response.json()) as { text?: string; reference?: string };
    const text = typeof payload.text === "string" ? cleanQuoteText(payload.text) : "";

    if (!text) {
      throw new Error("API returned empty quote text");
    }

    return {
      quote: {
        reference:
          typeof payload.reference === "string" && payload.reference.trim()
            ? payload.reference.trim()
            : reference,
        text,
        dateKey,
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch {
    const fallbackPool = FALLBACK_QUOTES.filter((quote) => quote.reference !== currentReference);
    const fallback = randomItem(fallbackPool.length > 0 ? fallbackPool : FALLBACK_QUOTES);

    return {
      quote: {
        reference: fallback.reference,
        text: fallback.text,
        dateKey,
        fetchedAt: new Date().toISOString(),
      },
      warning:
        "Live Bible quote service is unavailable right now, so a built-in Douay-Rheims verse is shown.",
    };
  }
}
