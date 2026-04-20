import {
  ActivityIndicator, Alert, FlatList, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { fetchTeamEvents } from '../../lib/api';
import { EventListing, ExtendedEventListing, ExtendedTeamListing } from '../../lib/models';
import { YEARS, APP_GREEN } from '../../lib/constants';
import { parseTeamFullName, getDisplayLocation } from '../../lib/utils';

const teamEventCache: Record<string, Record<number, EventListing[]>> = {};

export default function TeamDetailScreen() {
  const router = useRouter();
  const app = useApp();
  const params = useLocalSearchParams<{ number: string; data: string }>();
  const team: ExtendedTeamListing = JSON.parse(params.data);
  const cacheKey = String(team.teamNumber);
  if (!teamEventCache[cacheKey]) teamEventCache[cacheKey] = {};

  const [selectedYearIndex, setSelectedYearIndex] = useState(YEARS.indexOf(String(team.year)) >= 0 ? YEARS.indexOf(String(team.year)) : YEARS.length - 1);
  const selectedYear = parseInt(YEARS[selectedYearIndex]);

  const [events, setEvents] = useState<EventListing[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isFav = app.isFavoritedTeam(team);
  const [favorited, setFavorited] = useState(isFav);

  function toggleFavorite() {
    if (!favorited) {
      if (app.favoritedTeams.length >= 10) {
        Alert.alert('Limit reached', 'You can only favorite up to 10 teams.');
        return;
      }
      app.addFavoritedTeam(team);
      setFavorited(true);
    } else {
      app.removeFavoritedTeam(team);
      setFavorited(false);
    }
  }

  async function loadEvents(year: number, force = false) {
    if (!force && teamEventCache[cacheKey][year] !== undefined) {
      setEvents(teamEventCache[cacheKey][year]);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchTeamEvents(year, team.teamNumber, app.user, app.token);
      teamEventCache[cacheKey][year] = result;
      setEvents(result);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
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
  }, [selectedYearIndex]);

  const { school, sponsors } = parseTeamFullName(team.fullTeamName);

  function navigateToEvent(event: EventListing) {
    const ext: ExtendedEventListing = { ...event, year: selectedYear };
    router.push({ pathname: '/event/[code]', params: { code: event.code, data: JSON.stringify(ext) } });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* AppBar */}
      <View style={styles.appBar}>
        <Pressable onPress={() => router.back()} style={styles.appBarBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.titleScroll}>
          <Text style={styles.appBarTitle}>{team.teamNumber} - {team.teamName}</Text>
        </ScrollView>
        <Pressable onPress={toggleFavorite} style={styles.appBarBtn}>
          <Ionicons name={favorited ? 'star' : 'star-outline'} size={24} color="#000" />
        </Pressable>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* General Info */}
        <View style={styles.section}>
          <View style={styles.sectionPad} />
          <Text style={styles.sectionTitle}>General Information</Text>
          <View style={styles.sectionDivider} />

          {school && school.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={22} color="#333" style={styles.infoIcon} />
              <Text style={styles.infoText}>{school}</Text>
            </View>
          )}
          {sponsors && (
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={22} color="#333" style={styles.infoIcon} />
              <Text style={styles.infoText}>{sponsors}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={22} color="#333" style={styles.infoIcon} />
            <Text style={styles.infoText}>{getDisplayLocation(team)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={22} color="#333" style={styles.infoIcon} />
            <Text style={styles.infoText}>Rookie Year: {team.rookieYear}</Text>
          </View>
        </View>

        {/* Events */}
        <View style={styles.section}>
          <View style={styles.sectionPad} />
          <Text style={styles.sectionTitle}>Events</Text>
          <View style={styles.sectionDivider} />

          {/* Year tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearTabBar}>
            {YEARS.map((y, i) => (
              <Pressable
                key={y}
                style={[styles.yearTab, i === selectedYearIndex && styles.yearTabSelected]}
                onPress={() => setSelectedYearIndex(i)}
              >
                <Text style={[styles.yearTabText, i === selectedYearIndex && styles.yearTabTextSelected]}>{y}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#2a7a2a" />
            </View>
          ) : events && events.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No events to show</Text>
            </View>
          ) : (
            events && (
              <View>
                <View style={styles.itemDivider} />
                {events.map((event) => (
                  <View key={event.code}>
                    <Pressable style={styles.eventRow} onPress={() => navigateToEvent(event)}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{event.name}</Text>
                      <View style={styles.eventSubRow}>
                        <Text style={styles.eventSub}>{event.city}, {event.country}</Text>
                        <Text style={styles.eventSub}>{event.dateStart}</Text>
                      </View>
                    </Pressable>
                    <View style={styles.itemDivider} />
                  </View>
                ))}
              </View>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  appBar: {
    height: 56,
    backgroundColor: APP_GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  appBarBtn: { padding: 10 },
  titleScroll: { flex: 1 },
  appBarTitle: { fontSize: 17, fontWeight: '600', paddingVertical: 8 },
  section: {},
  sectionPad: { height: 8 },
  sectionTitle: { fontSize: 22, paddingHorizontal: 16, paddingVertical: 4 },
  sectionDivider: { height: 6, backgroundColor: '#ADD8E6' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  infoIcon: { marginRight: 16 },
  infoText: { fontSize: 15, flex: 1 },
  yearTabBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  yearTab: { paddingHorizontal: 16, paddingVertical: 10 },
  yearTabSelected: { backgroundColor: '#e0e0e0' },
  yearTabText: { fontSize: 14, color: '#333' },
  yearTabTextSelected: { fontWeight: '600', color: '#000' },
  loadingBox: { padding: 40, alignItems: 'center' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#666' },
  eventRow: { paddingHorizontal: 16, paddingVertical: 10 },
  eventTitle: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  eventSubRow: { flexDirection: 'row', justifyContent: 'space-between' },
  eventSub: { fontSize: 13, color: '#555' },
  itemDivider: { height: 1, backgroundColor: '#000' },
});
