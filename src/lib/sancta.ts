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

export type LiturgicalSeasonKey =
  | "advent"
  | "christmas"
  | "lent"
  | "easter"
  | "ordinary";

export type LiturgicalSeason = {
  key: LiturgicalSeasonKey;
  label: string;
};

export type QuoteResult = {
  quote: VerseQuote;
  warning?: string;
};

export type SanctaExportPayload = {
  version: number;
  exportedAt: string;
  state: SanctaState;
};

const COMPLETION_RETENTION_DAYS = 60;

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

const LITURGICAL_LABELS: Record<LiturgicalSeasonKey, string> = {
  advent: "Advent",
  christmas: "Christmas",
  lent: "Lent",
  easter: "Easter",
  ordinary: "Ordinary Time",
};

const SEASONAL_REFERENCES: Record<LiturgicalSeasonKey, readonly string[]> = {
  advent: [
    "Isaiah 7:14",
    "Isaiah 9:2",
    "Isaiah 9:6",
    "Isaiah 11:1",
    "Isaiah 35:4",
    "Isaiah 40:3",
    "Jeremiah 33:14",
    "Micah 5:2",
    "Zechariah 9:9",
    "Malachi 3:1",
    "Psalm 24:7",
    "Psalm 80:3",
    "Matthew 1:23",
    "Matthew 24:42",
    "Luke 1:26",
    "Luke 1:38",
    "Luke 1:46",
    "Luke 1:68",
    "Romans 13:11",
    "James 5:8",
    "Revelation 22:20",
  ],
  christmas: [
    "Isaiah 9:6",
    "Micah 5:2",
    "Psalm 98:3",
    "Psalm 96:11",
    "Matthew 2:1",
    "Matthew 2:11",
    "Luke 2:10",
    "Luke 2:11",
    "Luke 2:14",
    "Luke 2:29",
    "John 1:5",
    "John 1:14",
    "Galatians 4:4",
    "Titus 3:4",
    "Hebrews 1:1",
    "Colossians 1:15",
    "1 John 4:9",
    "Philippians 2:10",
    "2 Corinthians 9:15",
    "Ephesians 2:4",
  ],
  lent: [
    "Joel 2:12",
    "Isaiah 58:6",
    "Ezekiel 36:26",
    "Hosea 6:1",
    "Jonah 2:2",
    "Psalm 51:10",
    "Psalm 130:1",
    "Proverbs 28:13",
    "Matthew 4:4",
    "Matthew 6:6",
    "Matthew 6:21",
    "Matthew 11:28",
    "Luke 9:23",
    "Luke 15:18",
    "Luke 18:13",
    "John 8:11",
    "James 4:8",
    "1 John 1:9",
    "Romans 12:12",
    "2 Corinthians 5:20",
    "2 Corinthians 7:10",
    "Deuteronomy 8:3",
  ],
  easter: [
    "Psalm 118:24",
    "Matthew 28:6",
    "Mark 16:6",
    "Luke 24:6",
    "Luke 24:32",
    "John 11:25",
    "John 20:29",
    "Acts 2:24",
    "Acts 4:12",
    "Acts 10:40",
    "Romans 6:4",
    "Romans 8:11",
    "1 Corinthians 15:20",
    "2 Corinthians 5:17",
    "Ephesians 2:5",
    "Colossians 3:1",
    "1 Peter 1:3",
    "Revelation 1:18",
    "Hebrews 12:2",
    "John 14:19",
  ],
  ordinary: [
    "Joshua 1:9",
    "Psalm 16:8",
    "Psalm 19:14",
    "Psalm 23:1",
    "Psalm 27:1",
    "Psalm 34:8",
    "Psalm 37:5",
    "Psalm 46:10",
    "Psalm 90:14",
    "Psalm 103:2",
    "Proverbs 3:5",
    "Proverbs 16:3",
    "Ecclesiastes 3:1",
    "Isaiah 41:10",
    "Isaiah 43:2",
    "Jeremiah 29:11",
    "Micah 6:8",
    "Matthew 5:8",
    "Matthew 5:16",
    "Matthew 6:33",
    "Matthew 11:30",
    "John 8:12",
    "John 10:10",
    "John 14:6",
    "John 15:5",
    "Romans 8:28",
    "Romans 12:2",
    "Romans 12:12",
    "1 Corinthians 10:31",
    "1 Corinthians 13:4",
    "2 Corinthians 12:9",
    "Galatians 5:22",
    "Philippians 4:6",
    "Philippians 4:13",
    "Colossians 3:12",
    "1 Thessalonians 5:16",
    "1 Thessalonians 5:17",
    "2 Timothy 1:7",
    "Hebrews 11:1",
    "James 1:5",
    "1 Peter 5:7",
    "1 John 4:19",
  ],
};

const FALLBACK_QUOTES: Record<LiturgicalSeasonKey, Array<Pick<VerseQuote, "reference" | "text">>> = {
  advent: [
    {
      reference: "Luke 1:38",
      text: "Behold the handmaid of the Lord; be it done to me according to thy word.",
    },
    {
      reference: "Isaiah 9:2",
      text: "The people that walked in darkness, have seen a great light.",
    },
  ],
  christmas: [
    {
      reference: "Luke 2:11",
      text: "For, this day, is born to you a Saviour, who is Christ the Lord, in the city of David.",
    },
    {
      reference: "John 1:14",
      text: "And the Word was made flesh, and dwelt among us.",
    },
  ],
  lent: [
    {
      reference: "Matthew 11:28",
      text: "Come to me, all you that labour, and are burdened, and I will refresh you.",
    },
    {
      reference: "Psalm 51:10",
      text: "Create a clean heart in me, O God: and renew a right spirit within my bowels.",
    },
  ],
  easter: [
    {
      reference: "Matthew 28:6",
      text: "He is not here, for he is risen, as he said.",
    },
    {
      reference: "John 11:25",
      text: "I am the resurrection and the life: he that believeth in me, although he be dead, shall live.",
    },
  ],
  ordinary: [
    {
      reference: "Matthew 5:8",
      text: "Blessed are the clean of heart: for they shall see God.",
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
  ],
};

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

function getEpiphanyDate(year: number): Date {
  const jan2 = new Date(year, 0, 2, 12, 0, 0, 0);
  const offset = (7 - jan2.getDay()) % 7;
  const epiphany = new Date(jan2);
  epiphany.setDate(jan2.getDate() + offset);
  return epiphany;
}

function getBaptismOfTheLord(year: number): Date {
  const epiphany = getEpiphanyDate(year);
  const baptism = new Date(epiphany);

  if (epiphany.getDate() >= 7) {
    baptism.setDate(epiphany.getDate() + 1);
  } else {
    baptism.setDate(epiphany.getDate() + 7);
  }

  baptism.setHours(12, 0, 0, 0);
  return baptism;
}

function getAdventStart(year: number): Date {
  const nov27 = new Date(year, 10, 27, 12, 0, 0, 0);
  const offset = (7 - nov27.getDay()) % 7;
  const advent = new Date(nov27);
  advent.setDate(nov27.getDate() + offset);
  return advent;
}

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
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

export function getLiturgicalSeason(dateOrDateKey: Date | string): LiturgicalSeason {
  const date = typeof dateOrDateKey === "string" ? parseDateKey(dateOrDateKey) : new Date(dateOrDateKey);
  const year = date.getFullYear();

  const christmasStartCurrentYear = new Date(year, 11, 25, 12, 0, 0, 0);
  const christmasStartPrevYear = new Date(year - 1, 11, 25, 12, 0, 0, 0);
  const adventStart = getAdventStart(year);

  const easter = getEasterDate(year);
  const ashWednesday = new Date(easter);
  ashWednesday.setDate(easter.getDate() - 46);
  ashWednesday.setHours(12, 0, 0, 0);

  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);
  pentecost.setHours(12, 0, 0, 0);

  const baptismThisYear = getBaptismOfTheLord(year);

  if (date >= christmasStartCurrentYear) {
    return { key: "christmas", label: LITURGICAL_LABELS.christmas };
  }

  if (date >= adventStart && date < christmasStartCurrentYear) {
    return { key: "advent", label: LITURGICAL_LABELS.advent };
  }

  if (date >= ashWednesday && date < easter) {
    return { key: "lent", label: LITURGICAL_LABELS.lent };
  }

  if (date >= easter && date <= pentecost) {
    return { key: "easter", label: LITURGICAL_LABELS.easter };
  }

  if (date >= christmasStartPrevYear && date <= baptismThisYear) {
    return { key: "christmas", label: LITURGICAL_LABELS.christmas };
  }

  return { key: "ordinary", label: LITURGICAL_LABELS.ordinary };
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
    return {
      practices: [],
      completionByDate: {},
    };
  }

  const parsed = raw as Partial<SanctaState>;

  const practices = Array.isArray(parsed.practices)
    ? parsed.practices
        .map((entry) => normalizePractice(entry))
        .filter((entry): entry is Practice => Boolean(entry))
    : [];

  const validIds = new Set(practices.map((practice) => practice.id));
  const completionByDate: CompletionByDate = {};
  const cutoffDay = dayNumber(toDateKey(new Date())) - COMPLETION_RETENTION_DAYS;

  if (parsed.completionByDate && typeof parsed.completionByDate === "object") {
    Object.entries(parsed.completionByDate).forEach(([dateKey, ids]) => {
      if (!isDateKey(dateKey) || !Array.isArray(ids)) {
        return;
      }

      if (dayNumber(dateKey) < cutoffDay) {
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

export function createExportPayload(state: SanctaState): SanctaExportPayload {
  const normalized = normalizeState(state);

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    state: normalized,
  };
}

export function parseImportPayload(raw: unknown): SanctaState | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const value = raw as Record<string, unknown>;

  if ("state" in value) {
    const nested = value.state;
    if (!nested || typeof nested !== "object") {
      return null;
    }

    return normalizeState(nested);
  }

  if ("practices" in value || "completionByDate" in value || "quote" in value) {
    return normalizeState(value);
  }

  return null;
}

export async function fetchDouayRheimsQuote(
  dateKey: string,
  currentReference?: string,
  seasonKey?: LiturgicalSeasonKey,
): Promise<QuoteResult> {
  const resolvedSeasonKey = seasonKey ?? getLiturgicalSeason(dateKey).key;
  const seasonalPool = SEASONAL_REFERENCES[resolvedSeasonKey];
  const referencePool = seasonalPool.filter((reference) => reference !== currentReference);
  const reference = randomItem(referencePool.length > 0 ? referencePool : seasonalPool);

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
    const fallbacks = FALLBACK_QUOTES[resolvedSeasonKey];
    const fallbackPool = fallbacks.filter((quote) => quote.reference !== currentReference);
    const fallback = randomItem(fallbackPool.length > 0 ? fallbackPool : fallbacks);

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
