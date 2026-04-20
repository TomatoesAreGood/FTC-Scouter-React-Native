import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExtendedEventListing, ExtendedTeamListing } from './models';

const KEYS = {
  user: 'savedUser',
  token: 'savedToken',
  events: 'savedEvents',
  teams: 'savedTeams',
};

export async function getSavedUser(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.user);
}

export async function getSavedToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.token);
}

export async function setSavedUser(user: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.user, user);
}

export async function setSavedToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.token, token);
}

export async function hasSavedCredentials(): Promise<boolean> {
  const user = await getSavedUser();
  const token = await getSavedToken();
  return user !== null && token !== null;
}

export async function logOut(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.user, KEYS.token]);
}

export async function getSavedEvents(): Promise<ExtendedEventListing[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.events);
    if (!raw) return [];
    return JSON.parse(raw) as ExtendedEventListing[];
  } catch {
    return [];
  }
}

export async function setSavedEvents(events: ExtendedEventListing[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.events, JSON.stringify(events));
}

export async function getSavedTeams(): Promise<ExtendedTeamListing[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.teams);
    if (!raw) return [];
    return JSON.parse(raw) as ExtendedTeamListing[];
  } catch {
    return [];
  }
}

export async function setSavedTeams(teams: ExtendedTeamListing[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.teams, JSON.stringify(teams));
}
