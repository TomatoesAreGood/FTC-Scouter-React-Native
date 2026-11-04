import {
  ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { fetchTeamEvents } from '../../lib/api';
import { EventListing, ExtendedEventListing, ExtendedTeamListing } from '../../lib/models';
import { formatSeason } from '../../lib/constants';
import { parseTeamFullName, getDisplayLocation, parseRouteData, sortEventsByDate } from '../../lib/utils';
import { colors, fontSize, spacing } from '../../lib/theme';
import AppHeader, { HeaderButton } from '../../components/AppHeader';
import SectionHeader from '../../components/SectionHeader';
import TabStrip from '../../components/TabStrip';
import { EventRow } from '../../components/ListRows';
import { MessageView } from '../../components/StateViews';

const teamEventCache: Record<string, Record<number, EventListing[]>> = {};

export default function TeamDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ number: string; data: string }>();
  const team = useMemo(() => parseRouteData<ExtendedTeamListing>(params.data), [params.data]);

  if (!team) {
    return (
      <View style={styles.container}>
        <AppHeader title="Team" />
        <MessageView message="This team couldn't be opened." actionLabel="Go back" onAction={() => router.back()} />
      </View>
    );
  }
  return <TeamDetail team={team} />;
}

function TeamDetail({ team }: { team: ExtendedTeamListing }) {
  const router = useRouter();
  const app = useApp();
  const insets = useSafeAreaInsets();
  const cacheKey = String(team.teamNumber);
  if (!teamEventCache[cacheKey]) teamEventCache[cacheKey] = {};

  // Newest season first; skip seasons before the team existed.
  const years = useMemo(() => {
    const eligible = app.seasons.filter((y) => !team.rookieYear || parseInt(y, 10) >= team.rookieYear);
    return [...(eligible.length > 0 ? eligible : app.seasons)].reverse();
  }, [team.rookieYear, app.seasons]);

  // Track the chosen season by value (not list position) so it stays correct if the
  // season list is refined once the API reports which seasons exist.
  const [chosenYear, setChosenYear] = useState(String(team.year));
  const selectedYearIndex = Math.max(0, years.indexOf(chosenYear));
  const selectedYear = parseInt(years[selectedYearIndex], 10);

  const [events, setEvents] = useState<EventListing[] | null>(teamEventCache[cacheKey][selectedYear] ?? null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const requestedYear = useRef(selectedYear);

  const favorited = app.isFavoritedTeam(team);

  function toggleFavorite() {
    if (favorited) {
      app.removeFavoritedTeam(team);
    } else if (app.favoritedTeams.length >= 10) {
      Alert.alert('Limit reached', 'You can favorite up to 10 teams. Remove one from Favorites to add another.');
    } else {
      app.addFavoritedTeam(team);
    }
  }

  async function loadEvents(year: number, force = false) {
    requestedYear.current = year;
    if (!force && teamEventCache[cacheKey][year] !== undefined) {
      setEvents(teamEventCache[cacheKey][year]);
      setError(false);
      return;
    }
    if (!force) setLoading(true);
    setError(false);
    try {
      const result = sortEventsByDate(await fetchTeamEvents(year, team.teamNumber, app.user, app.token));
      teamEventCache[cacheKey][year] = result;
      if (requestedYear.current === year) setEvents(result);
    } catch {
      if (requestedYear.current === year) setError(true);
    } finally {
      if (requestedYear.current === year) setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadEvents(selectedYear, true);
    setRefreshing(false);
  }

  useEffect(() => {
    setEvents(null);
    loadEvents(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const { school, sponsors } = parseTeamFullName(team.fullTeamName);
  const location = getDisplayLocation(team);

  function navigateToEvent(event: EventListing) {
    const ext: ExtendedEventListing = { ...event, year: selectedYear };
    router.push({ pathname: '/event/[code]', params: { code: event.code, data: JSON.stringify(ext) } });
  }

  let eventsContent: React.ReactNode;
  if (loading) {
    eventsContent = (
      <View style={styles.inlineState}>
        <ActivityIndicator color={colors.brandDark} />
      </View>
    );
  } else if (error) {
    eventsContent = (
      <View style={styles.inlineState}>
        <Text style={styles.inlineText}>Couldn't load events.</Text>
        <Pressable onPress={() => loadEvents(selectedYear, true)} hitSlop={8} accessibilityRole="button">
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  } else if (events && events.length === 0) {
    eventsContent = (
      <View style={styles.inlineState}>
        <Text style={styles.inlineText}>No events for the {formatSeason(selectedYear)} season.</Text>
      </View>
    );
  } else if (events) {
    eventsContent = events.map((event) => (
      <EventRow key={event.code} event={event} onPress={() => navigateToEvent(event)} />
    ));
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title={`Team ${team.teamNumber}`}
        subtitle={team.teamName || undefined}
        right={
          <HeaderButton
            icon={favorited ? 'star' : 'star-outline'}
            label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            onPress={toggleFavorite}
          />
        }
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.sm }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandDark} colors={[colors.brandDark]} />
        }
      >
        <SectionHeader title="Team Info" />
        <View>
          {team.teamName ? <InfoRow icon="people-outline" text={team.teamName} /> : null}
          {school ? <InfoRow icon="school-outline" text={school} /> : null}
          {sponsors ? <InfoRow icon="business-outline" text={sponsors} /> : null}
          {location ? <InfoRow icon="location-outline" text={location} /> : null}
          {team.rookieYear ? <InfoRow icon="calendar-outline" text={`Rookie year ${team.rookieYear}`} /> : null}
        </View>
        <View>
          <SectionHeader title="Events" />
          <TabStrip tabs={years.map((y) => formatSeason(y))} selectedIndex={selectedYearIndex} onSelect={(i) => setChosenYear(years[i])} />
        </View>
        <View>{eventsContent}</View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.infoIcon} />
      <Text style={styles.infoText} selectable>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  infoIcon: { marginRight: spacing.lg, width: 20 },
  infoText: { flex: 1, fontSize: fontSize.body, color: colors.text, lineHeight: 20 },
  inlineState: {
    paddingVertical: 32,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineText: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center' },
  retryText: { fontSize: fontSize.body, fontWeight: '600', color: colors.brandDark },
});
