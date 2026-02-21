"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Practice,
  fetchDouayRheimsQuote,
  formatDateLabel,
  frequencyLabel,
  listDueOnDate,
  toDateKey,
  toggleCompleted,
} from "@/lib/sancta";
import { useSanctaState } from "@/lib/useSanctaState";

function sortByTitle(items: Practice[]): Practice[] {
  return [...items].sort((a, b) => a.title.localeCompare(b.title));
}

export default function TodayPage() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const {
    isLoaded,
    practices,
    completionByDate,
    setCompletionByDate,
    quote,
    setQuote,
  } = useSanctaState();

  const [statusMessage, setStatusMessage] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteWarning, setQuoteWarning] = useState("");

  const dueToday = useMemo(() => {
    return sortByTitle(listDueOnDate(practices, todayKey));
  }, [practices, todayKey]);

  const completedTodaySet = useMemo(() => {
    return new Set(completionByDate[todayKey] ?? []);
  }, [completionByDate, todayKey]);

  const completedCount = useMemo(() => {
    return dueToday.filter((practice) => completedTodaySet.has(practice.id)).length;
  }, [completedTodaySet, dueToday]);

  const progressPercent = dueToday.length > 0 ? Math.round((completedCount / dueToday.length) * 100) : 0;

  const loadQuote = useCallback(
    async (forceNew: boolean) => {
      setQuoteLoading(true);

      const result = await fetchDouayRheimsQuote(todayKey, forceNew ? quote?.reference : undefined);
      setQuote(result.quote);
      setQuoteWarning(result.warning ?? "");

      setQuoteLoading(false);
    },
    [quote?.reference, setQuote, todayKey],
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
    const isDone = completedTodaySet.has(practiceId);
    setCompletionByDate((current) => toggleCompleted(current, todayKey, practiceId));

    setStatusMessage(isDone ? "Marked as not done for today." : "Marked complete for today.");
  }

  if (!isLoaded) {
    return (
      <div className="shell">
        <main className="layout loading-layout">
          <section className="card">
            <p>Loading your today view...</p>
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
            <h1 className="brand-title">Sancta List</h1>
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

        <section className="hero enter enter-delay-1">
          <div>
            <p className="hero-day">{formatDateLabel(todayKey)}</p>
            <p className="hero-line">Focus on today&apos;s practices and keep your prayer rhythm simple.</p>
          </div>

          <div className="hero-stats" role="group" aria-label="Today stats">
            <article className="stat-tile">
              <p className="stat-label">Due Today</p>
              <p className="stat-value">{dueToday.length}</p>
            </article>
            <article className="stat-tile">
              <p className="stat-label">Completed</p>
              <p className="stat-value">{completedCount}</p>
            </article>
            <article className="stat-tile">
              <p className="stat-label">Progress</p>
              <p className="stat-value">{progressPercent}%</p>
            </article>
          </div>

          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </section>

        {statusMessage ? <p className="status-banner enter enter-delay-2">{statusMessage}</p> : null}

        <section className="today-grid stagger">
          <article className="card tasks-card">
            <div className="card-head">
              <h2>Today&apos;s Checklist</h2>
              <Link href="/settings" className="inline-link">
                Edit Practices
              </Link>
            </div>

            {dueToday.length === 0 ? (
              <div className="empty-box">
                <p>No practices due right now.</p>
                <p>Add or adjust practices in Settings.</p>
              </div>
            ) : (
              <ul className="list-clean">
                {dueToday.map((practice) => {
                  const done = completedTodaySet.has(practice.id);

                  return (
                    <li key={practice.id} className={`practice-row${done ? " is-done" : ""}`}>
                      <button
                        type="button"
                        className={`check-toggle${done ? " is-done" : ""}`}
                        onClick={() => toggleForToday(practice.id)}
                        aria-pressed={done}
                      >
                        {done ? "Done" : "Mark done"}
                      </button>

                      <div>
                        <h3>{practice.title}</h3>
                        <p>{frequencyLabel(practice)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="card quote-card">
            <div className="card-head">
              <h2>Douay-Rheims Quote</h2>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  void loadQuote(true);
                }}
                disabled={quoteLoading}
              >
                {quoteLoading ? "Refreshing..." : "New Verse"}
              </button>
            </div>

            <p className="muted-small">Public domain Douay-Rheims translation.</p>

            <blockquote className="verse-text">
              {quoteLoading && !quote ? "Loading verse..." : quote?.text ?? "Loading verse..."}
            </blockquote>
            <p className="verse-reference">{quote?.reference ?? ""}</p>

            {quoteWarning ? <p className="verse-warning">{quoteWarning}</p> : null}
          </article>
        </section>
      </main>
    </div>
  );
}
