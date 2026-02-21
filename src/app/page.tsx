"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Practice,
  fetchDouayRheimsQuote,
  getLiturgicalSeason,
  listDueOnDate,
  toDateKey,
  toggleCompleted,
} from "@/lib/sancta";
import { useSanctaState } from "@/lib/useSanctaState";

function sortDueItems(items: Practice[], completedIds: Set<string>): Practice[] {
  return [...items].sort((left, right) => {
    const leftDone = completedIds.has(left.id);
    const rightDone = completedIds.has(right.id);

    if (leftDone !== rightDone) {
      return leftDone ? 1 : -1;
    }

    return left.title.localeCompare(right.title);
  });
}

export default function TodayPage() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const season = useMemo(() => getLiturgicalSeason(todayKey), [todayKey]);

  const {
    isLoaded,
    practices,
    completionByDate,
    setCompletionByDate,
    quote,
    setQuote,
  } = useSanctaState();

  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteWarning, setQuoteWarning] = useState("");

  const completedTodaySet = useMemo(() => {
    return new Set(completionByDate[todayKey] ?? []);
  }, [completionByDate, todayKey]);

  const dueToday = useMemo(() => {
    return sortDueItems(listDueOnDate(practices, todayKey), completedTodaySet);
  }, [completedTodaySet, practices, todayKey]);

  const completedCount = useMemo(() => {
    return dueToday.filter((practice) => completedTodaySet.has(practice.id)).length;
  }, [completedTodaySet, dueToday]);

  const loadQuote = useCallback(
    async (forceNew: boolean) => {
      setQuoteLoading(true);

      const result = await fetchDouayRheimsQuote(
        todayKey,
        forceNew ? quote?.reference : undefined,
        season.key,
      );
      setQuote(result.quote);
      setQuoteWarning(result.warning ?? "");

      setQuoteLoading(false);
    },
    [quote?.reference, season.key, setQuote, todayKey],
  );

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!quote || quote.dateKey !== todayKey) {
      const timer = window.setTimeout(() => {
        void loadQuote(false);
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [isLoaded, loadQuote, quote, todayKey]);

  function toggleForToday(practiceId: string): void {
    setCompletionByDate((current) => toggleCompleted(current, todayKey, practiceId));
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
          <div>
            <h1 className="brand-title">Index Sanctus</h1>
            <p className="small-note season-note">{season.label}</p>
          </div>

          <nav className="tabs" aria-label="Primary">
            <Link href="/" className="tab is-active">
              Today
            </Link>
            <Link href="/settings" className="tab">
              Settings
            </Link>
          </nav>
        </header>

        <section className="card">
          <div className="section-head">
            <h2>Quote</h2>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                void loadQuote(true);
              }}
              disabled={quoteLoading}
            >
              {quoteLoading ? "..." : "New"}
            </button>
          </div>

          <blockquote className="quote-text">
            {quoteLoading && !quote ? "Loading..." : quote?.text ?? "Loading..."}
          </blockquote>
          <p className="quote-ref">{quote?.reference ?? ""}</p>
          {quoteWarning ? <p className="small-note">{quoteWarning}</p> : null}
        </section>

        <section className="card">
          <div className="section-head">
            <h2>Today</h2>
            <p className="small-note progress-note">
              {completedCount}/{dueToday.length} done
            </p>
          </div>

          {dueToday.length === 0 ? (
            <p className="empty">No tasks.</p>
          ) : (
            <ul className="list-clean">
              {dueToday.map((practice) => {
                const done = completedTodaySet.has(practice.id);

                return (
                  <li key={practice.id} className={`task-row${done ? " is-done" : ""}`}>
                    <button
                      type="button"
                      className={`check-toggle${done ? " is-done" : ""}`}
                      onClick={() => toggleForToday(practice.id)}
                      aria-pressed={done}
                    >
                      {done ? "Done" : "Do"}
                    </button>
                    <h3>{practice.title}</h3>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
