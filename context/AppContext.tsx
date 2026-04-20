import React, { createContext, useContext, useEffect, useState } from 'react';
import { ExtendedEventListing, ExtendedTeamListing, TeamListing, YearlyTeamListing } from '../lib/models';
import { EventListing } from '../lib/models';
import { getSavedEvents, getSavedTeams, setSavedEvents, setSavedTeams } from '../lib/storage';

interface AppContextType {
  user: string;
  token: string;
  setCredentials: (user: string, token: string) => void;

  // Cached API results
  yearlyEventListings: Record<string, EventListing[]>;
  setYearlyEventListings: (year: string, events: EventListing[]) => void;
  yearlyTeamListings: Record<string, YearlyTeamListing>;
  setYearlyTeamListings: (year: string, listing: YearlyTeamListing) => void;
  appendTeamsForYear: (year: string, teams: TeamListing[], page: number) => void;

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
  const [eventsYear, setEventsYear] = useState('2024');
  const [teamsYear, setTeamsYear] = useState('2024');

  useEffect(() => {
    getSavedEvents().then(setFavoritedEvents);
    getSavedTeams().then(setFavoritedTeams);
  }, []);

  function setCredentials(u: string, t: string) {
    setUser(u);
    setToken(t);
  }

  function setYearlyEventListings(year: string, events: EventListing[]) {
    setEventListings((prev) => ({ ...prev, [year]: events }));
  }

  function setYearlyTeamListings(year: string, listing: YearlyTeamListing) {
    setTeamListings((prev) => ({ ...prev, [year]: listing }));
  }

  function appendTeamsForYear(year: string, teams: TeamListing[], page: number) {
    setTeamListings((prev) => {
      const existing = prev[year];
      if (!existing) {
        return { ...prev, [year]: { page, teams } };
      }
      return { ...prev, [year]: { page, teams: [...existing.teams, ...teams] } };
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
