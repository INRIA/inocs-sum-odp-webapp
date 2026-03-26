import React, { useEffect, useRef, useState } from "react";
import ApiClient from "../../../lib/api-client/ApiClient";
import type { IGiscoSearchResult } from "../../../types/Gisco";
import { RButton } from "../ui";

const api = new ApiClient();

const COOLDOWN_MS = 5000;

type Props = {
  onSelect: (result: IGiscoSearchResult) => void;
};

export function CitySearchSelector({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IGiscoSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Initialized to -Infinity so the very first search always proceeds
  const lastSearchTimeRef = useRef<number>(Number.NEGATIVE_INFINITY);

  // Decrement countdown by 1 every second until it reaches 0
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [countdown]);

  async function handleSearch() {
    if (!query.trim()) return;

    const elapsed = Date.now() - lastSearchTimeRef.current;
    const remaining = COOLDOWN_MS - elapsed;

    if (remaining > 0) {
      setCountdown(Math.ceil(remaining / 1000));
      return;
    }

    lastSearchTimeRef.current = Date.now();
    setIsLoading(true);
    setCountdown(0);

    try {
      const data = await api.searchCities(query);
      setResults(data);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full overflow-auto">
      <div>
        <label htmlFor="city-search" className="block text-sm font-medium mb-1">
          Search city
        </label>
        <div className="flex gap-2">
          <input
            id="city-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Lille, France"
            className="flex-1 min-w-0 rounded-md border border-zinc-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:focus:border-blue-400"
          />
          <RButton
            type="button"
            onClick={handleSearch}
            disabled={isLoading}
            variant="primary"
          >
            {isLoading ? "Searching..." : "Search"}
          </RButton>
        </div>
      </div>

      {countdown > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          ⏳ Please wait {countdown}s — we limit searches to one every 5 seconds
          to be respectful to the city search service and avoid rate limits.
        </p>
      )}

      {!isLoading && hasSearched && results.length === 0 && countdown === 0 && (
        <p className="text-sm text-zinc-500 py-2">No results found.</p>
      )}

      {results.length > 0 && (
        <ul className="space-y-1 overflow-auto max-h-72">
          {results.map((result, i) => (
            <li key={`${result.label}-${i}`}>
              <button
                type="button"
                aria-label={result.label}
                onClick={() => onSelect(result)}
                className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-zinc-700"
              >
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {result.cityName}
                </span>
                {result.postalCode && (
                  <span className="ml-1 text-xs text-zinc-500">
                    ({result.postalCode})
                  </span>
                )}
                <span className="ml-1 text-zinc-500">— {result.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
