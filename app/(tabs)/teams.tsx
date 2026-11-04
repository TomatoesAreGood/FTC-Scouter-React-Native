import {
  ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { fetchTeamsPage, searchTeamByNumber } from '../../lib/api';
import { TeamListing, ExtendedTeamListing } from '../../lib/models';
import { formatSeason } from '../../lib/constants';
import { colors, fontSize, spacing } from '../../lib/theme';
import AppHeader from '../../components/AppHeader';
import { useDrawer } from '../../components/Drawer';
import PickerSheet from '../../components/PickerSheet';
import SearchField from '../../components/SearchField';
import { TeamRow } from '../../components/ListRows';
import { LoadingView, MessageView } from '../../components/StateViews';

export default function TeamsScreen() {
  const router = useRouter();
  const app = useApp();
  const drawer = useDrawer();
  const listRef = useRef<FlatList<TeamListing>>(null);

  const [selectedYear, setSelectedYear] = useState(app.teamsYear);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [teams, setTeams] = useState<TeamListing[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageTotal, setPageTotal] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Guards against a slow response for a previous season overwriting the current one.
  const requestedYear = useRef(selectedYear);

  async function loadTeams(year: string, page: number, opts: { force?: boolean; silent?: boolean } = {}) {
    requestedYear.current = year;
    const cached = app.yearlyTeamListings[year];
    if (page === 1 && cached && !opts.force) {
      setTeams(cached.teams);
      setCurrentPage(cached.page);
      setPageTotal(cached.pageTotal);
      setError(false);
      return;
    }
    if (page === 1) {
      if (!opts.silent) setLoading(true);
      setError(false);
    } else {
      setLoadingMore(true);
      setLoadMoreError(false);
    }
    try {
      const result = await fetchTeamsPage(year, page, app.user, app.token);
      if (requestedYear.current !== year) return;
      setPageTotal(result.pageTotal);
      if (page === 1) {
        setTeams(result.teams);
        app.setYearlyTeamListings(year, { page: 1, pageTotal: result.pageTotal, teams: result.teams });
      } else {
        setTeams((prev) => [...prev, ...result.teams]);
        app.appendTeamsForYear(year, result.teams, page, result.pageTotal);
      }
      setCurrentPage(page);
    } catch {
      if (requestedYear.current !== year) return;
      if (page === 1) setError(true);
      else setLoadMoreError(true);
    } finally {
      if (requestedYear.current === year) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadTeams(selectedYear, 1, { force: true, silent: true });
    setRefreshing(false);
  }

  const isFirstLoad = useRef(true);
  useEffect(() => {
    loadTeams(selectedYear, 1);
    app.setTeamsYear(selectedYear);
    // When switching seasons, start the new list at the top (nothing to scroll on first load).
    if (!isFirstLoad.current) listRef.current?.scrollToOffset({ offset: 0, animated: false });
    isFirstLoad.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  async function handleSearch() {
    const query = searchText.trim();
    if (!query) return;
    const num = parseInt(query, 10);
    if (isNaN(num) || !/^\d+$/.test(query)) {
      Alert.alert('Invalid team number', 'Search by team number using digits only.');
      return;
    }
    setSearching(true);
    try {
      const found = await searchTeamByNumber(selectedYear, num, app.user, app.token);
      if (found) {
        navigateToTeam(found);
      } else {
        Alert.alert('Team not found', `Team ${num} isn't registered for the ${formatSeason(selectedYear)} season.`);
      }
    } catch {
      Alert.alert('Search failed', 'Check your connection and try again.');
    } finally {
      setSearching(false);
    }
  }

  function navigateToTeam(team: TeamListing) {
    const ext: ExtendedTeamListing = { ...team, year: parseInt(selectedYear, 10) };
    router.push({ pathname: '/team/[number]', params: { number: String(team.teamNumber), data: JSON.stringify(ext) } });
  }

  function onEndReached() {
    if (!loadingMore && !loading && !loadMoreError && currentPage < pageTotal) {
      loadTeams(selectedYear, currentPage + 1);
    }
  }

  let footer: React.ReactElement | undefined;
  if (loadingMore) {
    footer = <ActivityIndicator style={styles.footer} color={colors.brandDark} />;
  } else if (loadMoreError) {
    footer = (
      <Pressable style={styles.footer} onPress={() => loadTeams(selectedYear, currentPage + 1)} accessibilityRole="button">
        <Text style={styles.footerText}>Couldn't load more teams. Tap to retry.</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Teams"
        subtitle={app.seasonSummaries[selectedYear]?.gameName
          ? `${formatSeason(selectedYear)} · ${app.seasonSummaries[selectedYear]?.gameName}`
          : `${formatSeason(selectedYear)} season`}
        onMenu={drawer.open}
      />

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <SearchField
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Find team by number"
            keyboardType="number-pad"
            onSubmit={handleSearch}
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.toolbarButton, pressed && styles.toolbarButtonPressed]}
          onPress={handleSearch}
          disabled={searching || !searchText.trim()}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          {searching ? (
            <ActivityIndicator size="small" color={colors.brandDark} />
          ) : (
            <Text style={[styles.toolbarButtonText, !searchText.trim() && styles.toolbarButtonTextDisabled]}>Go</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.seasonButton, pressed && styles.toolbarButtonPressed]}
          onPress={() => setYearPickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Season: ${formatSeason(selectedYear)}`}
        >
          <Text style={styles.seasonText}>{formatSeason(selectedYear)}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </Pressable>
      </View>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <MessageView
          title="Couldn't load teams"
          message="Check your connection and try again."
          onAction={() => loadTeams(selectedYear, 1, { force: true })}
        />
      ) : (
        <FlatList
          ref={listRef}
          data={teams}
          keyExtractor={(item) => String(item.teamNumber)}
          renderItem={({ item }) => <TeamRow team={item} onPress={() => navigateToTeam(item)} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={footer}
          ListEmptyComponent={
            <MessageView message={`No teams are registered for the ${formatSeason(selectedYear)} season yet.`} />
          }
          contentContainerStyle={teams.length === 0 ? styles.listContent : undefined}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScroll={(e) => {
            const show = e.nativeEvent.contentOffset.y > 800;
            if (show !== showScrollTop) setShowScrollTop(show);
          }}
          scrollEventThrottle={100}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandDark} colors={[colors.brandDark]} />
          }
        />
      )}

      {showScrollTop && !loading && !error ? (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
          accessibilityRole="button"
          accessibilityLabel="Scroll to top"
        >
          <Ionicons name="arrow-up" size={22} color="#fff" />
        </Pressable>
      ) : null}

      <PickerSheet
        visible={yearPickerVisible}
        title="Season"
        options={[...app.seasons].reverse().map((y) => ({
          value: y, label: formatSeason(y), detail: app.seasonSummaries[y]?.gameName,
        }))}
        selected={selectedYear}
        onSelect={(v) => { setSelectedYear(v); setYearPickerVisible(false); }}
        onClose={() => setYearPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { flexGrow: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  searchWrap: { flex: 1 },
  toolbarButton: {
    height: 38,
    minWidth: 44,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  toolbarButtonPressed: { backgroundColor: colors.pressed },
  toolbarButtonText: { fontSize: fontSize.body, fontWeight: '600', color: colors.brandDark },
  toolbarButtonTextDisabled: { color: colors.textTertiary },
  seasonButton: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  seasonText: { fontSize: fontSize.secondary, fontWeight: '500', color: colors.text },
  footer: { padding: spacing.lg, alignItems: 'center' },
  footerText: { fontSize: fontSize.secondary, color: colors.brandDark },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  fabPressed: { opacity: 0.85 },
});
