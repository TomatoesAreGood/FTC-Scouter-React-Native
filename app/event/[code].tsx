import {
  ActivityIndicator, Alert, FlatList, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, View, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import {
  fetchEventRankings, fetchEventSchedule, fetchEventAwards,
} from '../../lib/api';
import {
  ExtendedEventListing, TeamPerformanceData, HybridMatchData, Award,
} from '../../lib/models';
import { EVENT_TYPES, APP_GREEN } from '../../lib/constants';
import { sortThree } from '../../lib/utils';

const TABS = ['Teams', 'Rankings', 'Schedule', 'Awards', 'About'];

// Per-event cache stored outside component to survive tab switches
const eventCache: Record<string, { rankings?: TeamPerformanceData[]; schedule?: HybridMatchData[][]; awards?: Award[] }> = {};

export default function EventDetailScreen() {
  const router = useRouter();
  const app = useApp();
  const params = useLocalSearchParams<{ code: string; data: string }>();
  const eventData: ExtendedEventListing = JSON.parse(params.data);
  const cacheKey = `${eventData.code}-${eventData.year}`;
  if (!eventCache[cacheKey]) eventCache[cacheKey] = {};

  const [selectedTab, setSelectedTab] = useState(0);
  const isFav = app.isFavoritedEvent(eventData);
  const [favorited, setFavorited] = useState(isFav);

  function toggleFavorite() {
    if (!favorited) {
      if (app.favoritedEvents.length >= 10) {
        Alert.alert('Limit reached', 'You can only favorite up to 10 events.');
        return;
      }
      app.addFavoritedEvent(eventData);
      setFavorited(true);
    } else {
      app.removeFavoritedEvent(eventData);
      setFavorited(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* AppBar */}
      <View style={styles.appBar}>
        <Pressable onPress={() => router.back()} style={styles.appBarBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.titleScroll}>
          <Text style={styles.appBarTitle}>{eventData.name}</Text>
        </ScrollView>
        <Pressable onPress={toggleFavorite} style={styles.appBarBtn}>
          <Ionicons name={favorited ? 'star' : 'star-outline'} size={24} color="#000" />
        </Pressable>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <Pressable
            key={tab}
            style={[styles.tabBtn, i === selectedTab && styles.tabBtnSelected]}
            onPress={() => setSelectedTab(i)}
          >
            <Text style={[styles.tabBtnText, i === selectedTab && styles.tabBtnTextSelected]}>{tab}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tab content */}
      {selectedTab === 0 && <TeamsTab eventData={eventData} cacheKey={cacheKey} />}
      {selectedTab === 1 && <RankingsTab eventData={eventData} cacheKey={cacheKey} />}
      {selectedTab === 2 && <ScheduleTab eventData={eventData} cacheKey={cacheKey} />}
      {selectedTab === 3 && <AwardsTab eventData={eventData} cacheKey={cacheKey} />}
      {selectedTab === 4 && <AboutTab eventData={eventData} />}
    </SafeAreaView>
  );
}

// ─── Teams Tab ───────────────────────────────────────────────────────────────
function TeamsTab({ eventData, cacheKey }: { eventData: ExtendedEventListing; cacheKey: string }) {
  const app = useApp();
  const [data, setData] = useState<TeamPerformanceData[] | null>(eventCache[cacheKey].rankings ?? null);
  const [loading, setLoading] = useState(!eventCache[cacheKey].rankings);
  const [refreshing, setRefreshing] = useState(false);

  async function load(force = false) {
    if (!force && eventCache[cacheKey].rankings) { setData(eventCache[cacheKey].rankings!); return; }
    setLoading(true);
    try {
      const result = await fetchEventRankings(eventData.year, eventData.code, app.user, app.token);
      eventCache[cacheKey].rankings = result;
      setData(result);
    } catch { setData([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Centered><ActivityIndicator size="large" color="#2a7a2a" /></Centered>;

  const sorted = data ? [...data].sort((a, b) => a.teamNumber - b.teamNumber) : [];

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => String(item.teamNumber)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(true); setRefreshing(false); }} />}
      ListHeaderComponent={<View style={styles.rankHeader}><Text style={styles.rankHeaderNum}>#</Text><Text style={styles.rankHeaderTeam}>Team</Text></View>}
      ListEmptyComponent={<NoInfo />}
      renderItem={({ item }) => (
        <View style={styles.rankRow}>
          <Text style={styles.rankRowNum}>{item.teamNumber}</Text>
          <Text style={styles.rankRowName} numberOfLines={1}>{item.teamName ?? ''}</Text>
        </View>
      )}
    />
  );
}

// ─── Rankings Tab ─────────────────────────────────────────────────────────────
function RankingsTab({ eventData, cacheKey }: { eventData: ExtendedEventListing; cacheKey: string }) {
  const app = useApp();
  const [data, setData] = useState<TeamPerformanceData[] | null>(eventCache[cacheKey].rankings ?? null);
  const [loading, setLoading] = useState(!eventCache[cacheKey].rankings);
  const [refreshing, setRefreshing] = useState(false);

  async function load(force = false) {
    if (!force && eventCache[cacheKey].rankings) { setData(eventCache[cacheKey].rankings!); return; }
    setLoading(true);
    try {
      const result = await fetchEventRankings(eventData.year, eventData.code, app.user, app.token);
      eventCache[cacheKey].rankings = result;
      setData(result);
    } catch { setData([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Centered><ActivityIndicator size="large" color="#2a7a2a" /></Centered>;
  if (!data || data.length === 0) return <NoInfo />;

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.teamNumber)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(true); setRefreshing(false); }} />}
      ListHeaderComponent={
        <View style={[styles.rankHeader, { paddingRight: 8 }]}>
          <Text style={[styles.rankHeaderNum, { width: 36 }]}>Rank</Text>
          <Text style={[styles.rankHeaderTeam, { flex: 1 }]}>Team</Text>
          <Text style={styles.rankHeaderStat}>W-L-T</Text>
          <Text style={styles.rankHeaderStat}>RP</Text>
          <Text style={styles.rankHeaderStat}>TBP</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.rankRow, { paddingRight: 8 }]}>
          <Text style={[styles.rankRowNum, { width: 36 }]}>{item.rank}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rankRowName} numberOfLines={1}>{item.teamNumber} {item.teamName ?? ''}</Text>
          </View>
          <Text style={styles.rankRowStat}>{item.wins}-{item.losses}-{item.ties}</Text>
          <Text style={styles.rankRowStat}>{item.rankingPoints}</Text>
          <Text style={styles.rankRowStat}>{item.tieBreakerPoints}</Text>
        </View>
      )}
    />
  );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────
function ScheduleTab({ eventData, cacheKey }: { eventData: ExtendedEventListing; cacheKey: string }) {
  const app = useApp();
  const [data, setData] = useState<HybridMatchData[][] | null>(eventCache[cacheKey].schedule ?? null);
  const [loading, setLoading] = useState(!eventCache[cacheKey].schedule);
  const [refreshing, setRefreshing] = useState(false);

  async function load(force = false) {
    if (!force && eventCache[cacheKey].schedule) { setData(eventCache[cacheKey].schedule!); return; }
    setLoading(true);
    try {
      const result = await fetchEventSchedule(eventData.year, eventData.code, app.user, app.token);
      eventCache[cacheKey].schedule = result;
      setData(result);
    } catch { setData([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Centered><ActivityIndicator size="large" color="#2a7a2a" /></Centered>;
  if (!data || data.length === 0 || data[0]?.length === 0) return <NoInfo />;

  function getSectionTitle(matches: HybridMatchData[]): string {
    if (!matches.length) return 'Other';
    const lvl = matches[0].tournamentLevel;
    if (lvl === 1) return 'Qualifications';
    if (lvl === 2) return 'Semifinals';
    if (lvl === 3) return 'Finals';
    if (lvl === 4) return 'Playoffs';
    return 'Other';
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(_, i) => String(i)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(true); setRefreshing(false); }} />}
      renderItem={({ item: matches }) => (
        <ScheduleSection title={getSectionTitle(matches)} matches={matches} />
      )}
    />
  );
}

function ScheduleSection({ title, matches }: { title: string; matches: HybridMatchData[] }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <View>
      <Pressable style={styles.scheduleHeader} onPress={() => setExpanded((v) => !v)}>
        <Text style={styles.scheduleHeaderText}>{title}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#555" />
      </Pressable>
      {expanded && (
        <View>
          <View style={styles.scheduleBlueBar} />
          {matches.length === 0 ? (
            <Text style={styles.noMatchText}>No recorded matches</Text>
          ) : (
            matches.map((match, i) => <MatchRow key={i} match={match} />)
          )}
        </View>
      )}
    </View>
  );
}

function MatchRow({ match }: { match: HybridMatchData }) {
  function label() {
    if (match.tournamentLevel === 1) return `Q-${match.matchNumber}`;
    if (match.tournamentLevel === 2) return `SF-${match.matchNumber}.${match.seriesNumber}`;
    if (match.tournamentLevel === 3) return `F-${match.matchNumber}.${match.seriesNumber}`;
    return `P-${match.matchNumber}.${match.seriesNumber}`;
  }

  const redSorted = sortThree(match.redTeam);
  const blueSorted = sortThree(match.blueTeam);

  return (
    <View>
      <View style={styles.matchRow}>
        <Text style={styles.matchLabel}>{label()}</Text>
        <View style={styles.matchTeams}>
          {redSorted.map((n, i) => <Text key={i} style={styles.redTeam}>{n}</Text>)}
        </View>
        <Text style={[styles.matchScore, styles.redScore, match.isRedWin && styles.scoreWin]}>
          {match.scoreRedFinal}
        </Text>
        <Text style={[styles.matchScore, styles.blueScore, !match.isRedWin && styles.scoreWin]}>
          {match.scoreBlueFinal}
        </Text>
        <View style={styles.matchTeams}>
          {blueSorted.map((n, i) => <Text key={i} style={styles.blueTeam}>{n}</Text>)}
        </View>
      </View>
      <View style={styles.matchDivider} />
    </View>
  );
}

// ─── Awards Tab ──────────────────────────────────────────────────────────────
function AwardsTab({ eventData, cacheKey }: { eventData: ExtendedEventListing; cacheKey: string }) {
  const app = useApp();
  const [awards, setAwards] = useState<Award[] | null>(eventCache[cacheKey].awards ?? null);
  const [loading, setLoading] = useState(!eventCache[cacheKey].awards);
  const [refreshing, setRefreshing] = useState(false);

  async function load(force = false) {
    if (!force && eventCache[cacheKey].awards) { setAwards(eventCache[cacheKey].awards!); return; }
    setLoading(true);
    try {
      const result = await fetchEventAwards(eventData.year, eventData.code, app.user, app.token);
      eventCache[cacheKey].awards = result;
      setAwards(result);
    } catch { setAwards([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Centered><ActivityIndicator size="large" color="#2a7a2a" /></Centered>;

  // Get team names from cached rankings
  const rankingsCache = eventCache[cacheKey].rankings ?? [];
  const displayNames: Record<number, string> = {};
  for (const r of rankingsCache) displayNames[r.teamNumber] = r.teamName ?? 'Unknown';

  // Group by award name
  const grouped: Record<string, string[]> = {};
  for (const a of awards ?? []) {
    const key = a.name ?? 'Other';
    const val = a.awardId === 10
      ? `${a.person} (${a.teamNumber} - ${displayNames[a.teamNumber!] ?? 'Unknown'})`
      : `${a.teamNumber} - ${displayNames[a.teamNumber!] ?? 'Unknown'}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(val);
  }

  const sections = Object.entries(grouped);
  if (sections.length === 0) return <NoInfo />;

  return (
    <FlatList
      data={sections}
      keyExtractor={([name]) => name}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(true); setRefreshing(false); }} />}
      renderItem={({ item: [name, recipients] }) => (
        <AwardSection name={name} recipients={recipients} />
      )}
    />
  );
}

function AwardSection({ name, recipients }: { name: string; recipients: string[] }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <View>
      <Pressable style={styles.scheduleHeader} onPress={() => setExpanded((v) => !v)}>
        <Text style={styles.scheduleHeaderText}>{name}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#555" />
      </Pressable>
      {expanded && (
        <View>
          <View style={styles.scheduleBlueBar} />
          {recipients.map((r, i) => (
            <View key={i} style={styles.awardRow}>
              <Text style={styles.awardText}>{i + 1}.   {r}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── About Tab ────────────────────────────────────────────────────────────────
function AboutTab({ eventData }: { eventData: ExtendedEventListing }) {
  const typeName = EVENT_TYPES[eventData.type] ?? `Type ${eventData.type}`;
  return (
    <ScrollView contentContainerStyle={styles.aboutContainer}>
      <AboutRow icon="trophy-outline" label="Event Type" value={typeName} />
      <AboutRow icon="flag-outline" label="Country" value={eventData.country} />
      <AboutRow icon="location-outline" label="City" value={eventData.city} />
      {eventData.venue && <AboutRow icon="business-outline" label="Venue" value={eventData.venue} />}
      <AboutRow icon="calendar-outline" label="Dates" value={`${eventData.dateStart} – ${eventData.dateEnd}`} />
      {eventData.website && (
        <Pressable onPress={() => Linking.openURL(eventData.website!)} style={styles.aboutLinkRow}>
          <Ionicons name="globe-outline" size={20} color="#0066cc" style={styles.aboutIcon} />
          <Text style={styles.aboutLink}>Official Website</Text>
        </Pressable>
      )}
      {eventData.liveStream && (
        <Pressable onPress={() => Linking.openURL(eventData.liveStream!)} style={styles.aboutLinkRow}>
          <Ionicons name="videocam-outline" size={20} color="#0066cc" style={styles.aboutIcon} />
          <Text style={styles.aboutLink}>Live Stream</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function AboutRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.aboutRow}>
      <Ionicons name={icon} size={20} color="#333" style={styles.aboutIcon} />
      <View>
        <Text style={styles.aboutLabel}>{label}</Text>
        <Text style={styles.aboutValue}>{value}</Text>
      </View>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

function NoInfo() {
  return (
    <View style={styles.centered}>
      <Text style={styles.noInfoText}>
        No information has been published about this event. Please check back later.
      </Text>
    </View>
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
  tabBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  tabBtnSelected: { backgroundColor: '#e0e0e0' },
  tabBtnText: { fontSize: 14, color: '#333' },
  tabBtnTextSelected: { fontWeight: '600', color: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  noInfoText: { fontSize: 15, color: '#555', textAlign: 'center' },
  rankHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rankHeaderNum: { width: 60, fontSize: 13, fontWeight: '600' },
  rankHeaderTeam: { flex: 1, fontSize: 13, fontWeight: '600' },
  rankHeaderStat: { width: 48, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  rankRowNum: { width: 60, fontSize: 15 },
  rankRowName: { flex: 1, fontSize: 14 },
  rankRowStat: { width: 48, fontSize: 13, textAlign: 'center' },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scheduleHeaderText: { fontSize: 16, fontWeight: '600' },
  scheduleBlueBar: { height: 5, backgroundColor: '#6699cc' },
  noMatchText: { padding: 12, color: '#666', fontSize: 15, textAlign: 'center' },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  matchLabel: { width: 70, fontSize: 16, fontWeight: '500' },
  matchTeams: { width: 48, alignItems: 'center' },
  matchScore: { width: 40, fontSize: 20, textAlign: 'center' },
  redScore: { color: '#cc0000', marginHorizontal: 4 },
  blueScore: { color: '#0044cc', marginHorizontal: 4 },
  scoreWin: { textDecorationLine: 'underline' },
  redTeam: { fontSize: 13, color: '#cc0000' },
  blueTeam: { fontSize: 13, color: '#0044cc' },
  matchDivider: { height: 1, backgroundColor: '#000' },
  awardRow: { paddingHorizontal: 16, paddingVertical: 8 },
  awardText: { fontSize: 14 },
  aboutContainer: { padding: 16 },
  aboutRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  aboutIcon: { marginRight: 12, marginTop: 2 },
  aboutLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  aboutValue: { fontSize: 15, color: '#000' },
  aboutLinkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  aboutLink: { fontSize: 15, color: '#0066cc', textDecorationLine: 'underline' },
});
