import {
  Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { fetchEventRankings, fetchEventSchedule, fetchEventAwards } from '../../lib/api';
import {
  Award, EventListing, ExtendedEventListing, HybridMatchData, MatchTeam, TeamPerformanceData,
} from '../../lib/models';
import { formatSeason, getEventTypeName } from '../../lib/constants';
import { formatRankValue, getSeasonRanking } from '../../lib/seasons';
import {
  formatDateRange, getDayNumber, getTodayDayNumber, openLink, parseRouteData,
} from '../../lib/utils';
import { colors, fontSize, spacing } from '../../lib/theme';
import AppHeader, { HeaderButton } from '../../components/AppHeader';
import SectionHeader from '../../components/SectionHeader';
import TabStrip from '../../components/TabStrip';
import { EventRow, rowDivider } from '../../components/ListRows';
import { LoadingView, MessageView } from '../../components/StateViews';

const TABS = ['Teams', 'Rankings', 'Schedule', 'Awards', 'About'];

interface EventCacheEntry {
  rankings?: TeamPerformanceData[];
  schedule?: HybridMatchData[][];
  awards?: Award[];
}

// Per-event cache stored outside the component so data survives tab switches.
const eventCache: Record<string, EventCacheEntry> = {};

function getCache(key: string): EventCacheEntry {
  if (!eventCache[key]) eventCache[key] = {};
  return eventCache[key];
}

/**
 * Loads one piece of event data with a shared cache, distinguishing the first load
 * (full-screen spinner), pull-to-refresh (keeps showing data), and failures.
 */
function useEventResource<K extends keyof EventCacheEntry>(
  cacheKey: string,
  field: K,
  fetcher: () => Promise<NonNullable<EventCacheEntry[K]>>
) {
  const cached = getCache(cacheKey)[field];
  const [data, setData] = useState<EventCacheEntry[K] | null>(cached ?? null);
  const [loading, setLoading] = useState(cached === undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  async function load(mode: 'initial' | 'refresh') {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const result = await fetcher();
      getCache(cacheKey)[field] = result;
      setData(result);
    } catch {
      if (mode === 'refresh' && data) {
        Alert.alert("Couldn't refresh", 'Check your connection and try again.');
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (cached === undefined) load('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    loading,
    error,
    refreshing,
    refresh: () => load('refresh'),
    retry: () => load('initial'),
  };
}

export default function EventDetailScreen() {
  const app = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ code: string; data: string }>();
  const eventData = useMemo(() => parseRouteData<ExtendedEventListing>(params.data), [params.data]);
  const [selectedTab, setSelectedTab] = useState(0);

  if (!eventData) {
    return (
      <View style={styles.container}>
        <AppHeader title="Event" />
        <MessageView message="This event couldn't be opened." actionLabel="Go back" onAction={() => router.back()} />
      </View>
    );
  }

  const cacheKey = `${eventData.code}-${eventData.year}`;
  const favorited = app.isFavoritedEvent(eventData);

  function toggleFavorite() {
    if (!eventData) return;
    if (favorited) {
      app.removeFavoritedEvent(eventData);
    } else if (app.favoritedEvents.length >= 10) {
      Alert.alert('Limit reached', 'You can favorite up to 10 events. Remove one from Favorites to add another.');
    } else {
      app.addFavoritedEvent(eventData);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title={eventData.name}
        subtitle={formatDateRange(eventData.dateStart, eventData.dateEnd)}
        right={
          <HeaderButton
            icon={favorited ? 'star' : 'star-outline'}
            label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            onPress={toggleFavorite}
          />
        }
      />
      <TabStrip tabs={TABS} selectedIndex={selectedTab} onSelect={setSelectedTab} />

      <View style={styles.content}>
        {selectedTab === 0 && <TeamsTab eventData={eventData} cacheKey={cacheKey} />}
        {selectedTab === 1 && <RankingsTab eventData={eventData} cacheKey={cacheKey} />}
        {selectedTab === 2 && <ScheduleTab eventData={eventData} cacheKey={cacheKey} />}
        {selectedTab === 3 && <AwardsTab eventData={eventData} cacheKey={cacheKey} />}
        {selectedTab === 4 && <AboutTab eventData={eventData} />}
      </View>
    </View>
  );
}

interface TabProps {
  eventData: ExtendedEventListing;
  cacheKey: string;
}

function useBottomPadding() {
  const insets = useSafeAreaInsets();
  return { paddingBottom: insets.bottom + spacing.sm };
}

// Must return a RefreshControl element itself, not a wrapper component: on Android,
// ScrollView clones this element and passes the list in as its children, so a wrapper
// that doesn't forward children/style makes the whole list disappear.
function refreshControl(refreshing: boolean, onRefresh: () => void) {
  return (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandDark} colors={[colors.brandDark]} />
  );
}

function ErrorView({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <MessageView title={`Couldn't load ${what}`} message="Check your connection and try again." onAction={onRetry} />
  );
}

/** Divisions of this event (e.g. World Championship divisions), from the cached season list. */
function useDivisions(eventData: ExtendedEventListing): EventListing[] {
  const app = useApp();
  const season = app.yearlyEventListings[String(eventData.year)] ?? [];
  return season.filter((e) => e.divisionCode === eventData.code);
}

/**
 * Empty state for a tab. Events split into divisions have no teams/rankings of their own,
 * so list the divisions instead; past events say nothing was published rather than
 * "check back later".
 */
function EmptyTab({ eventData, what, showDivisions }: { eventData: ExtendedEventListing; what: string; showDivisions?: boolean }) {
  const router = useRouter();
  const divisions = useDivisions(eventData);
  if (showDivisions && divisions.length > 0) {
    return (
      <View>
        <Text style={styles.divisionsIntro}>
          This event is split into divisions. {what[0].toUpperCase() + what.slice(1)} are listed under each division.
        </Text>
        <SectionHeader title="Divisions" meta={String(divisions.length)} />
        {divisions.map((d) => (
          <EventRow
            key={d.code}
            event={d}
            onPress={() => router.push({
              pathname: '/event/[code]',
              params: { code: d.code, data: JSON.stringify({ ...d, year: eventData.year }) },
            })}
          />
        ))}
      </View>
    );
  }
  const ended = eventData.dateEnd && getDayNumber(eventData.dateEnd) < getTodayDayNumber();
  return (
    <MessageView
      message={ended
        ? `No ${what} were published for this event.`
        : `No ${what} have been published for this event yet. Pull down to refresh, or check back later.`}
    />
  );
}

// ─── Teams Tab ───────────────────────────────────────────────────────────────
function TeamsTab({ eventData, cacheKey }: TabProps) {
  const app = useApp();
  const bottomPad = useBottomPadding();
  const res = useEventResource(cacheKey, 'rankings', () =>
    fetchEventRankings(eventData.year, eventData.code, app.user, app.token)
  );

  if (res.loading) return <LoadingView />;
  if (res.error) return <ErrorView what="teams" onRetry={res.retry} />;

  const sorted = [...(res.data ?? [])].sort((a, b) => a.teamNumber - b.teamNumber);

  return (
    <View style={styles.content}>
      {sorted.length > 0 ? (
        // Rendered outside the list so it stays in place without sticky-header machinery.
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colTeamNumber]}>Team</Text>
          <Text style={[styles.th, styles.colFlex]}>Name</Text>
          <Text style={styles.thMeta}>{sorted.length} teams</Text>
        </View>
      ) : null}
      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.teamNumber)}
        refreshControl={refreshControl(res.refreshing, res.refresh)}
        ListEmptyComponent={<EmptyTab eventData={eventData} what="teams" showDivisions />}
        contentContainerStyle={[styles.listContent, bottomPad]}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.tdStrong, styles.colTeamNumber]}>{item.teamNumber}</Text>
            <Text style={[styles.td, styles.colFlex]} numberOfLines={1}>{item.teamName ?? ''}</Text>
          </View>
        )}
      />
    </View>
  );
}

// ─── Rankings Tab ─────────────────────────────────────────────────────────────
function RankingsTab({ eventData, cacheKey }: TabProps) {
  const app = useApp();
  const bottomPad = useBottomPadding();
  const res = useEventResource(cacheKey, 'rankings', () =>
    fetchEventRankings(eventData.year, eventData.code, app.user, app.token)
  );

  if (res.loading) return <LoadingView />;
  if (res.error) return <ErrorView what="rankings" onRetry={res.retry} />;

  const data = res.data ?? [];
  // Column meanings change every season (see lib/seasons.ts).
  const ranking = getSeasonRanking(eventData.year);
  // Remote events have no head-to-head matches, so W-L-T is always 0-0-0 there.
  const hasRecord = data.some((r) => r.wins + r.losses + r.ties > 0);

  return (
    <View style={styles.content}>
      {data.length > 0 ? (
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colRank]}>#</Text>
          <Text style={[styles.th, styles.colFlex]}>Team</Text>
          <Text style={[styles.th, styles.colPrimary]}>{ranking.primary.label}</Text>
          <Text style={[styles.th, styles.colRecord]}>{hasRecord ? 'W-L-T' : 'Played'}</Text>
        </View>
      ) : null}
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.teamNumber)}
        refreshControl={refreshControl(res.refreshing, res.refresh)}
        ListEmptyComponent={<EmptyTab eventData={eventData} what="rankings" showDivisions />}
        contentContainerStyle={[styles.listContent, bottomPad]}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.tdStrong, styles.colRank]}>{item.rank > 0 ? item.rank : '–'}</Text>
            <View style={styles.colFlex}>
              <Text style={styles.td} numberOfLines={1}>
                <Text style={styles.tdStrong}>{item.teamNumber}</Text>
                {item.teamName ? <Text style={styles.tdSecondary}>{'  '}{item.teamName}</Text> : null}
              </Text>
              <Text style={styles.tdSub} numberOfLines={1}>
                {ranking.secondary
                  .map((c) => `${c.label} ${formatRankValue(item.sortOrders[c.index], c)}`)
                  .join('  ·  ')}
              </Text>
            </View>
            <Text style={[styles.tdStrong, styles.colPrimary]}>{formatRankValue(item.sortOrders[ranking.primary.index], ranking.primary)}</Text>
            <Text style={[styles.td, styles.colRecord]}>
              {hasRecord ? `${item.wins}-${item.losses}-${item.ties}` : item.matchesPlayed}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────
function getSectionTitle(matches: HybridMatchData[]): string {
  const lvl = matches[0]?.tournamentLevel;
  if (lvl === 1) return 'Qualifications';
  if (lvl === 2) return 'Semifinals';
  if (lvl === 3) return 'Finals';
  if (lvl === 4) return 'Playoffs';
  return 'Other';
}

function ScheduleTab({ eventData, cacheKey }: TabProps) {
  const app = useApp();
  const bottomPad = useBottomPadding();
  const res = useEventResource(cacheKey, 'schedule', () =>
    fetchEventSchedule(eventData.year, eventData.code, app.user, app.token)
  );
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  if (res.loading) return <LoadingView />;
  if (res.error) return <ErrorView what="the schedule" onRetry={res.retry} />;

  const sections = (res.data ?? []).filter((s) => s.length > 0);
  const allTeams = sections.flat().flatMap((m) => [...m.red, ...m.blue, ...m.solo]);
  const legend = [
    allTeams.some((t) => t.surrogate) ? '* surrogate' : null,
    allTeams.some((t) => t.sittingOut) ? 'faded: sat out this match' : null,
    allTeams.some((t) => t.dq) ? 'struck through: disqualified' : null,
  ].filter(Boolean);
  const isRemote = sections.length > 0 && sections.every((s) => s.every((m) => m.solo.length > 0));

  function toggle(i: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <FlatList
      data={sections}
      keyExtractor={(_, i) => String(i)}
      refreshControl={refreshControl(res.refreshing, res.refresh)}
      ListHeaderComponent={isRemote ? (
        <Text style={styles.scheduleNote}>Remote event: each team played its matches on its own field.</Text>
      ) : undefined}
      ListEmptyComponent={<EmptyTab eventData={eventData} what="matches" />}
      ListFooterComponent={legend.length > 0 ? <Text style={styles.legend}>{legend.join('   ·   ')}</Text> : undefined}
      contentContainerStyle={[styles.listContent, bottomPad]}
      renderItem={({ item: matches, index }) => {
        const isExpanded = !collapsed.has(index);
        return (
          <View>
            <SectionHeader
              title={getSectionTitle(matches)}
              meta={`${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`}
              expanded={isExpanded}
              onPress={() => toggle(index)}
            />
            {isExpanded &&
              matches.map((match, i) => (
                <MatchRow key={`${match.tournamentLevel}-${match.seriesNumber}-${match.matchNumber}-${i}`} match={match} />
              ))}
          </View>
        );
      }}
    />
  );
}

const BRACKET = /^(Upper|Lower|Final) Bracket Round (\d+)/i;

/**
 * Short match label. Formats by season:
 *  - Qualifications: Q12
 *  - 2019–2023 eliminations: SF1-2 (semifinal 1, match 2), F1 (finals match 1; the API sends series 0)
 *  - 2024+ double elimination: M5 (bracket match 5), F1/F2 for the final bracket
 */
function matchLabel(match: HybridMatchData): string {
  if (match.tournamentLevel === 1) return `Q${match.matchNumber}`;
  if (match.tournamentLevel === 2) return `SF${match.seriesNumber}-${match.matchNumber}`;
  if (match.tournamentLevel === 3) return `F${match.matchNumber}`;
  if (match.description && /^Final Bracket/i.test(match.description)) return `F${match.matchNumber}`;
  return match.matchNumber > 1 ? `M${match.seriesNumber}-${match.matchNumber}` : `M${match.seriesNumber}`;
}

/**
 * Extra context under the label when the description carries it: bracket round for
 * double elimination ("Upper R1"), or a non-standard round name such as
 * "Championship Finals", "AC Conference Finals" or the 2025 "da Vinci" finals.
 */
function matchCaption(match: HybridMatchData): string | null {
  const d = match.description;
  if (!d) return null;
  const bracket = d.match(BRACKET);
  if (bracket) {
    const side = bracket[1][0].toUpperCase() + bracket[1].slice(1).toLowerCase();
    return side === 'Final' ? 'Final' : `${side} R${bracket[2]}`;
  }
  if (/^(Qualification \d+|Semifinal \d+ Match \d+|Finals Match \d+)$/i.test(d)) return null;
  return d.replace(/\s+Match \d+$/i, '');
}

function MatchRow({ match }: { match: HybridMatchData }) {
  const played = match.scoreRedFinal !== null && match.scoreBlueFinal !== null;
  const caption = matchCaption(match);
  return (
    <View style={styles.matchRow}>
      <View style={styles.matchLabelCol}>
        <Text style={styles.matchLabel} numberOfLines={1} adjustsFontSizeToFit>{matchLabel(match)}</Text>
        {caption ? <Text style={styles.matchCaption} numberOfLines={2}>{caption}</Text> : null}
      </View>
      {match.solo.length > 0 ? (
        // Remote match: one team, scored on its own (the API reports it as the blue score).
        <View style={styles.matchAlliances}>
          <View style={[styles.allianceLine, styles.soloLine]}>
            <View style={styles.allianceTeams}>
              {match.solo.map((t) => <TeamNumber key={t.teamNumber} team={t} color={colors.text} />)}
            </View>
            <Text style={[styles.allianceScore, { color: colors.text }]}>
              {match.scoreBlueFinal ?? match.scoreRedFinal ?? '–'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.matchAlliances}>
          <AllianceLine teams={match.red} score={match.scoreRedFinal} won={played && match.isRedWin} color="red" />
          <AllianceLine teams={match.blue} score={match.scoreBlueFinal} won={played && match.isBlueWin} color="blue" />
        </View>
      )}
    </View>
  );
}

function TeamNumber({ team, color }: { team: MatchTeam; color: string }) {
  return (
    <Text
      style={[
        styles.allianceTeam,
        { color },
        (team.sittingOut || team.noShow) && styles.teamSatOut,
        team.dq && styles.teamDq,
      ]}
      accessibilityLabel={[
        `Team ${team.teamNumber}`,
        team.surrogate ? 'surrogate' : null,
        team.sittingOut ? 'sat out' : null,
        team.noShow ? 'no show' : null,
        team.dq ? 'disqualified' : null,
      ].filter(Boolean).join(', ')}
    >
      {team.teamNumber}{team.surrogate ? '*' : ''}
    </Text>
  );
}

function AllianceLine({
  teams, score, won, color,
}: { teams: MatchTeam[]; score: number | null; won: boolean; color: 'red' | 'blue' }) {
  const textColor = color === 'red' ? colors.red : colors.blue;
  return (
    <View style={[styles.allianceLine, { backgroundColor: color === 'red' ? colors.redTint : colors.blueTint }]}>
      <View style={styles.allianceTeams}>
        {teams.length === 0 ? (
          // Empty alliance slot: a bye in the bracket.
          <Text style={[styles.allianceTeam, { color: colors.textTertiary }]}>Bye</Text>
        ) : (
          teams.map((t) => <TeamNumber key={t.teamNumber} team={t} color={textColor} />)
        )}
      </View>
      <Text
        style={[
          styles.allianceScore,
          { color: score === null ? colors.textTertiary : textColor },
          won && styles.allianceScoreWin,
        ]}
      >
        {score === null ? '–' : score}
      </Text>
    </View>
  );
}

// ─── Awards Tab ──────────────────────────────────────────────────────────────
function AwardsTab({ eventData, cacheKey }: TabProps) {
  const app = useApp();
  const bottomPad = useBottomPadding();
  const res = useEventResource(cacheKey, 'awards', () =>
    fetchEventAwards(eventData.year, eventData.code, app.user, app.token)
  );
  const [rankings, setRankings] = useState<TeamPerformanceData[]>(getCache(cacheKey).rankings ?? []);

  // Team names come from the rankings endpoint; load them if the Teams/Rankings tabs haven't yet.
  useEffect(() => {
    if (getCache(cacheKey).rankings) return;
    fetchEventRankings(eventData.year, eventData.code, app.user, app.token)
      .then((r) => {
        getCache(cacheKey).rankings = r;
        setRankings(r);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (res.loading) return <LoadingView />;
  if (res.error) return <ErrorView what="awards" onRetry={res.retry} />;

  const names: Record<number, string> = {};
  for (const r of rankings) if (r.teamName) names[r.teamNumber] = r.teamName;

  // Group by award, keeping the API's presentation order; recipients by placement.
  const grouped: { name: string; recipients: Award[] }[] = [];
  for (const a of res.data ?? []) {
    const name = a.name ?? 'Award';
    let group = grouped.find((g) => g.name === name);
    if (!group) {
      group = { name, recipients: [] };
      grouped.push(group);
    }
    group.recipients.push(a);
  }
  for (const g of grouped) g.recipients.sort((a, b) => a.series - b.series);

  return (
    <FlatList
      data={grouped}
      keyExtractor={(g) => g.name}
      refreshControl={refreshControl(res.refreshing, res.refresh)}
      ListEmptyComponent={<EmptyTab eventData={eventData} what="awards" />}
      contentContainerStyle={[styles.listContent, bottomPad]}
      renderItem={({ item: group }) => {
        // Placements ("2nd Place") are numbered; alliance roles ("Captain") are shown as text;
        // awards with several equal winners (e.g. Judges' Choice) get neither.
        const ranked = group.recipients.some((a) => a.detail && /Place$/i.test(a.detail));
        return (
          <View>
            <SectionHeader title={group.name} />
            {group.recipients.map((a, i) => {
              const teamName = a.teamNumber != null ? names[a.teamNumber] : undefined;
              const teamLabel = a.teamNumber != null ? `${a.teamNumber}${teamName ? ` · ${teamName}` : ''}` : null;
              const role = a.detail && !/Place$/i.test(a.detail) ? a.detail : null;
              return (
                <View key={`${a.awardId}-${a.series}-${a.teamNumber}-${a.person}-${i}`} style={styles.awardRow}>
                  {ranked ? <Text style={styles.awardPlace}>{a.series || i + 1}</Text> : null}
                  <View style={styles.colFlex}>
                    {a.person ? (
                      <>
                        <Text style={styles.td} numberOfLines={1}>{a.person}</Text>
                        {teamLabel || role ? (
                          <Text style={styles.tdSub} numberOfLines={1}>{[teamLabel, role].filter(Boolean).join(' · ')}</Text>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Text style={styles.td} numberOfLines={1}>
                          <Text style={styles.tdStrong}>{a.teamNumber}</Text>
                          {teamName ? <Text style={styles.tdSecondary}>{'  '}{teamName}</Text> : null}
                        </Text>
                        {role ? <Text style={styles.tdSub} numberOfLines={1}>{role}</Text> : null}
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        );
      }}
    />
  );
}

// ─── About Tab ────────────────────────────────────────────────────────────────
function AboutTab({ eventData }: { eventData: ExtendedEventListing }) {
  const app = useApp();
  const bottomPad = useBottomPadding();
  const gameName = app.seasonSummaries[String(eventData.year)]?.gameName;
  const location = [eventData.city, eventData.country].filter(Boolean).join(', ');
  const format = eventData.remote ? 'Remote' : eventData.hybrid ? 'Hybrid (in person and remote)' : null;
  const parent = eventData.divisionCode
    ? (app.yearlyEventListings[String(eventData.year)] ?? []).find((e) => e.code === eventData.divisionCode)
    : undefined;
  return (
    <ScrollView contentContainerStyle={bottomPad}>
      <AboutRow icon="trophy-outline" label="Event" value={eventData.name} />
      <AboutRow icon="pricetag-outline" label="Type" value={getEventTypeName(eventData)} />
      <AboutRow
        icon="game-controller-outline"
        label="Season"
        value={gameName ? `${formatSeason(eventData.year)} · ${gameName}` : formatSeason(eventData.year)}
      />
      {format ? <AboutRow icon="wifi-outline" label="Format" value={format} /> : null}
      {eventData.divisionCode ? (
        <AboutRow icon="git-branch-outline" label="Division of" value={parent?.name ?? eventData.divisionCode} />
      ) : null}
      <AboutRow icon="calendar-outline" label="Dates" value={formatDateRange(eventData.dateStart, eventData.dateEnd)} />
      {eventData.venue ? <AboutRow icon="business-outline" label="Venue" value={eventData.venue} /> : null}
      {location ? <AboutRow icon="location-outline" label="Location" value={location} /> : null}
      <AboutRow icon="barcode-outline" label="Event Code" value={eventData.code} />
      {eventData.website ? (
        <LinkRow icon="globe-outline" label="Event Website" onPress={() => openLink(eventData.website!)} />
      ) : null}
      {eventData.liveStream ? (
        <LinkRow icon="videocam-outline" label="Live Stream" onPress={() => openLink(eventData.liveStream!)} />
      ) : null}
    </ScrollView>
  );
}

function AboutRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.aboutRow}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.aboutIcon} />
      <View style={styles.colFlex}>
        <Text style={styles.aboutLabel}>{label}</Text>
        <Text style={styles.aboutValue} selectable>{value}</Text>
      </View>
    </View>
  );
}

function LinkRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.aboutRow, styles.linkRow, pressed && styles.pressed]}
      accessibilityRole="link"
    >
      <Ionicons name={icon} size={20} color={colors.link} style={styles.aboutIcon} />
      <Text style={[styles.colFlex, styles.linkText]}>{label}</Text>
      <Ionicons name="open-outline" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  listContent: { flexGrow: 1 },
  pressed: { backgroundColor: colors.pressed },

  divisionsIntro: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    lineHeight: 21,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  // Tables (teams, rankings)
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  th: { fontSize: fontSize.caption, fontWeight: '600', color: colors.textSecondary },
  thMeta: { fontSize: fontSize.caption, color: colors.textSecondary },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    minHeight: 46,
    paddingVertical: 6,
    ...rowDivider,
  },
  td: { fontSize: fontSize.body - 1, color: colors.text, fontVariant: ['tabular-nums'] },
  tdStrong: { fontSize: fontSize.body - 1, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  tdSub: { fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 2, fontVariant: ['tabular-nums'] },
  tdSecondary: { color: colors.textSecondary, fontWeight: '400' },
  colTeamNumber: { width: 64 },
  colRank: { width: 34 },
  colFlex: { flex: 1, marginRight: spacing.sm },
  colPrimary: { width: 56, textAlign: 'right' },
  colRecord: { width: 60, textAlign: 'right' },

  // Schedule
  scheduleNote: {
    fontSize: fontSize.secondary,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  legend: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    ...rowDivider,
  },
  matchLabelCol: { width: 64, paddingRight: 6 },
  matchLabel: {
    fontSize: fontSize.secondary + 1,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  matchCaption: { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
  matchAlliances: { flex: 1, gap: 2 },
  allianceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 3,
    paddingHorizontal: spacing.sm,
    height: 26,
  },
  soloLine: { backgroundColor: colors.surfaceMuted },
  allianceTeams: { flex: 1, flexDirection: 'row' },
  allianceTeam: { width: 58, fontSize: fontSize.secondary + 1, fontVariant: ['tabular-nums'] },
  teamSatOut: { opacity: 0.4 },
  teamDq: { textDecorationLine: 'line-through' },
  allianceScore: {
    width: 44,
    textAlign: 'right',
    fontSize: fontSize.body,
    fontVariant: ['tabular-nums'],
  },
  allianceScoreWin: { fontWeight: '700' },

  // Awards
  awardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    minHeight: 46,
    paddingVertical: 6,
    ...rowDivider,
  },
  awardPlace: { width: 24, fontSize: fontSize.secondary, color: colors.textSecondary, fontVariant: ['tabular-nums'] },

  // About
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...rowDivider,
  },
  aboutIcon: { marginRight: spacing.lg, width: 20 },
  aboutLabel: { fontSize: fontSize.caption, color: colors.textSecondary, marginBottom: 2 },
  aboutValue: { fontSize: fontSize.body, color: colors.text },
  linkRow: { paddingVertical: 14 },
  linkText: { fontSize: fontSize.body, color: colors.link },
});
