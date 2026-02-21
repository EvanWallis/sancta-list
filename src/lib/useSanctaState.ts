"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  CompletionByDate,
  Practice,
  SanctaState,
  VerseQuote,
  readState,
  writeState,
} from "@/lib/sancta";

type UseSanctaStateResult = {
  isLoaded: boolean;
  practices: Practice[];
  setPractices: Dispatch<SetStateAction<Practice[]>>;
  completionByDate: CompletionByDate;
  setCompletionByDate: Dispatch<SetStateAction<CompletionByDate>>;
  quote: VerseQuote | null;
  setQuote: Dispatch<SetStateAction<VerseQuote | null>>;
};

export function useSanctaState(): UseSanctaStateResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [completionByDate, setCompletionByDate] = useState<CompletionByDate>({});
  const [quote, setQuote] = useState<VerseQuote | null>(null);

  useEffect(() => {
    const loaded = readState();

    const timer = window.setTimeout(() => {
      setPractices(loaded.practices);
      setCompletionByDate(loaded.completionByDate);
      setQuote(loaded.quote ?? null);
      setIsLoaded(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const nextState: SanctaState = {
      practices,
      completionByDate,
      quote: quote ?? undefined,
    };

    writeState(nextState);
  }, [completionByDate, isLoaded, practices, quote]);

  return {
    isLoaded,
    practices,
    setPractices,
    completionByDate,
    setCompletionByDate,
    quote,
    setQuote,
  };
}
