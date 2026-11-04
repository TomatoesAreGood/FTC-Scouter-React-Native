import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  EventListing, ExtendedEventListing, ExtendedTeamListing, SeasonSummary, TeamListing, YearlyTeamListing,
} from '../lib/models';
import { getSavedEvents, getSavedTeams, logOut, setSavedEvents, setSavedTeams } from '../lib/storage';
import {
  FALLBACK_CURRENT_SEASON, FALLBACK_SEASONS, KNOWN_SEASONS, buildSeasonList,
} from '../lib/constants';
import { fetchMaxSeason, fetchSeasonSummary } from '../lib/api';

interface AppContextType {
  user: string;
  token: string;
  setCredentials: (user: string, token: string) => void;
  /** Clears saved and in-memory credentials; the auth gate then routes to login. */
  signOut: () => Promise<void>;

  /** Seasons the API serves, oldest first (from the API's maxSeason once known). */
  seasons: string[];
  /** Game name + kickoff per season (live from the API, with built-in fallbacks). */
  seasonSummaries: Record<string, SeasonSummary>;

  // Cached API results
  yearlyEventListings: Record<string, EventListing[]>;
  setYearlyEventListings: (year: string, events: EventListing[]) => void;
  yearlyTeamListings: Record<string, YearlyTeamListing>;
  setYearlyTeamListings: (year: string, listing: YearlyTeamListing) => void;
  appendTeamsForYear: (year: string, teams: TeamListing[], page: number, pageTotal: number) => void;

  // Favorites
  favoritedEvents: ExtendedEventListing[];
  favoritedTeams: ExtendedTeamListing[];
  addFavoritedEvent: (event: ExtendedEventListing) => void;
  removeFavoritedEvent: (event: ExtendedEventListing) => void;
  isFavoritedEvent: (event: ExtendedEventListing) => boolean;
  addFavoritedTeam: (team: ExtendedTeamListing) => void;
  removeFavoritedTeam: (team: ExtendedTeamListing) => void;
  isFavoritedTeam: (team: ExtendedTeamListing) => boolean;

  // Persisted UI state
  eventsYear: string;
  setEventsYear: (y: string) => void;
  teamsYear: string;
  setTeamsYear: (y: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({
  children,
  initialUser,
  initialToken,
}: {
  children: React.ReactNode;
  initialUser: string;
  initialToken: string;
}) {
  const [user, setUser] = useState(initialUser);
  const [token, setToken] = useState(initialToken);
  const [yearlyEventListings, setEventListings] = useState<Record<string, EventListing[]>>({});
  const [yearlyTeamListings, setTeamListings] = useState<Record<string, YearlyTeamListing>>({});
  const [favoritedEvents, setFavoritedEvents] = useState<ExtendedEventListing[]>([]);
  const [favoritedTeams, setFavoritedTeams] = useState<ExtendedTeamListing[]>([]);
  const [eventsYear, setEventsYear] = useState(FALLBACK_CURRENT_SEASON);
  const [teamsYear, setTeamsYear] = useState(FALLBACK_CURRENT_SEASON);
  const [seasons, setSeasons] = useState<string[]>(FALLBACK_SEASONS);
  const [seasonSummaries, setSeasonSummaries] = useState<Record<string, SeasonSummary>>(KNOWN_SEASONS);

  useEffect(() => {
    getSavedEvents().then(setFavoritedEvents);
    getSavedTeams().then(setFavoritedTeams);
  }, []);

  // Ask the API which seasons exist (it rejects seasons it hasn't activated, so the
  // calendar alone can't be trusted around September), then load each season's game
  // name and kickoff date. Failures keep the built-in fallbacks.
  useEffect(() => {
    if (!user || !token) return;
    let cancelled = false;
    (async () => {
      let list = FALLBACK_SEASONS;
      try {
        const max = await fetchMaxSeason(user, token);
        if (max && !cancelled) {
          list = buildSeasonList(max);
          setSeasons(list);
          const latest = list[list.length - 1];
          const clamp = (y: string) => (parseInt(y, 10) > max ? latest : y);
          setEventsYear(clamp);
          setTeamsYear(clamp);
        }
      } catch {
        // keep fallbacks
      }
      const results = await Promise.all(
        list.map((y) => fetchSeasonSummary(y, user, token).then((sum) => [y, sum] as const).catch(() => null))
      );
      if (cancelled) return;
      setSeasonSummaries((prev) => {
        const next = { ...prev };
        for (const r of results) {
          if (!r) continue;
          const [y, sum] = r;
          next[y] = { gameName: sum.gameName ?? prev[y]?.gameName ?? null, kickoff: sum.kickoff ?? prev[y]?.kickoff ?? null };
        }
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, [user, token]);

  function setCredentials(u: string, t: string) {
    setUser(u);
    setToken(t);
  }

  async function signOut() {
    try {
      await logOut();
    } finally {
      setCredentials('', '');
    }
  }

  function setYearlyEventListings(year: string, events: EventListing[]) {
    setEventListings((prev) => ({ ...prev, [year]: events }));
  }

  function setYearlyTeamListings(year: string, listing: YearlyTeamListing) {
    setTeamListings((prev) => ({ ...prev, [year]: listing }));
  }

  function appendTeamsForYear(year: string, teams: TeamListing[], page: number, pageTotal: number) {
    setTeamListings((prev) => {
      const existing = prev[year];
      if (!existing) {
        return { ...prev, [year]: { page, pageTotal, teams } };
      }
      return { ...prev, [year]: { page, pageTotal, teams: [...existing.teams, ...teams] } };
    });
  }

  function isFavoritedEvent(event: ExtendedEventListing): boolean {
    return favoritedEvents.some(
      (e) => e.code === event.code && e.year === event.year
    );
  }

  function addFavoritedEvent(event: ExtendedEventListing) {
    const updated = [...favoritedEvents, event];
    setFavoritedEvents(updated);
    setSavedEvents(updated);
  }

  function removeFavoritedEvent(event: ExtendedEventListing) {
    const updated = favoritedEvents.filter(
      (e) => !(e.code === event.code && e.year === event.year)
    );
    setFavoritedEvents(updated);
    setSavedEvents(updated);
  }

  function isFavoritedTeam(team: ExtendedTeamListing): boolean {
    return favoritedTeams.some(
      (t) => t.teamNumber === team.teamNumber && t.rookieYear === team.rookieYear
    );
  }

  function addFavoritedTeam(team: ExtendedTeamListing) {
    const updated = [...favoritedTeams, team];
    setFavoritedTeams(updated);
    setSavedTeams(updated);
  }

  function removeFavoritedTeam(team: ExtendedTeamListing) {
    const updated = favoritedTeams.filter(
      (t) => !(t.teamNumber === team.teamNumber && t.rookieYear === team.rookieYear)
    );
    setFavoritedTeams(updated);
    setSavedTeams(updated);
  }

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        setCredentials,
        signOut,
        seasons,
        seasonSummaries,
        yearlyEventListings,
        setYearlyEventListings,
        yearlyTeamListings,
        setYearlyTeamListings,
        appendTeamsForYear,
        favoritedEvents,
        favoritedTeams,
        addFavoritedEvent,
        removeFavoritedEvent,
        isFavoritedEvent,
        addFavoritedTeam,
        removeFavoritedTeam,
        isFavoritedTeam,
        eventsYear,
        setEventsYear,
        teamsYear,
        setTeamsYear,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
