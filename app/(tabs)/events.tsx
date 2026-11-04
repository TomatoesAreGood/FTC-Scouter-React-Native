import {
  FlatList, Pressable, RefreshControl, SectionList, StyleSheet, Text, View,
} from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { fetchEvents } from '../../lib/api';
import { EventListing, ExtendedEventListing } from '../../lib/models';
import { formatSeason, getEventTypeOptions, getSeasonStartDate } from '../../lib/constants';
import {
  sortEventsByDate, splitWeeks, getWeekDateRange, getWeekIndexForDay, getTodayDayNumber,
} from '../../lib/utils';
import { colors, fontSize, spacing } from '../../lib/theme';
import AppHeader, { HeaderButton } from '../../components/AppHeader';
import { useDrawer } from '../../components/Drawer';
import PickerSheet from '../../components/PickerSheet';
import SectionHeader from '../../components/SectionHeader';
import { EventRow } from '../../components/ListRows';
import { LoadingView, MessageView } from '../../components/StateViews';
import SearchField from '../../components/SearchField';

type Picker = 'season' | 'region' | 'type' | null;

export default function EventsScreen() {
  const router = useRouter();
  const app = useApp();
  const drawer = useDrawer();

  const [selectedYear, setSelectedYear] = useState(app.eventsYear);
  const [countryFilter, setCountryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState(-1);
  const [searchText, setSearchText] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [events, setEvents] = useState<EventListing[]>(app.yearlyEventListings[app.eventsYear] ?? []);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openPicker, setOpenPicker] = useState<Picker>(null);
  // null = use the default (the current/upcoming week); otherwise the user's own choice.
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number> | null>(null);

  // Guards against a slow response for a previous season overwriting the current one.
  const requestedYear = useRef(selectedYear);

  async function loadEvents(year: string, forceRefresh = false) {
    requestedYear.current = year;
    if (!forceRefresh && app.yearlyEventListings[year]) {
      setEvents(app.yearlyEventListings[year]);
      setError(null);
      return;
    }
    if (!forceRefresh) setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents(year, app.user, app.token);
      if (requestedYear.current !== year) return;
      app.setYearlyEventListings(year, data);
      setEvents(data);
    } catch (e: any) {
      if (requestedYear.current !== year) return;
      setError(e?.message ?? 'Failed to load events');
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
    setExpandedWeeks(null);
    loadEvents(selectedYear);
    app.setEventsYear(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const countryOptions = useMemo(() => {
    const set = new Set(events.map((e) => e.country).filter(Boolean));
    if (countryFilter !== 'All') set.add(countryFilter);
    return ['All', ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [events, countryFilter]);

  const filteredEvents = useMemo(() => {
    let list = events;
    if (countryFilter !== 'All') list = list.filter((e) => e.country === countryFilter);
    if (typeFilter !== -1) list = list.filter((e) => e.type === typeFilter);
    const q = searchText.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.city ?? '').toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q)
      );
    }
    return sortEventsByDate(list);
  }, [events, countryFilter, typeFilter, searchText]);

  const isSearching = searchText.trim().length > 0;
  const seasonStart = getSeasonStartDate(selectedYear, app.seasonSummaries[selectedYear]);
  const latestSeason = app.seasons[app.seasons.length - 1];
  const gameName = app.seasonSummaries[selectedYear]?.gameName;

  // If the API reports fewer seasons than the calendar guessed, move off a season it doesn't serve.
  useEffect(() => {
    if (!app.seasons.includes(selectedYear)) setSelectedYear(latestSeason);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.seasons]);

  // Type filter options come from the event types present this season (they vary by season).
  const typeOptions = useMemo(() => getEventTypeOptions(events), [events]);

  const weeks = useMemo(
    () =>
      splitWeeks(seasonStart, filteredEvents)
        .map((list, index) => ({ list, index }))
        .filter((w) => w.list.length > 0),
    [seasonStart, filteredEvents]
  );

  // For the current season, open the week that's happening now (or the next one with events).
  const defaultExpanded = useMemo(() => {
    if (selectedYear !== latestSeason) return new Set<number>();
    const thisWeek = getWeekIndexForDay(seasonStart, getTodayDayNumber());
    const upcoming = weeks.find((w) => w.index >= thisWeek);
    return new Set<number>(upcoming ? [upcoming.index] : []);
  }, [selectedYear, latestSeason, seasonStart, weeks]);

  const expanded = expandedWeeks ?? defaultExpanded;

  function toggleWeek(index: number) {
    const next = new Set(expanded);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedWeeks(next);
  }

  const sections = weeks.map((w) => ({
    key: String(w.index),
    weekIndex: w.index,
    count: w.list.length,
    data: expanded.has(w.index) ? w.list : [],
  }));

  function navigateToEvent(event: EventListing) {
    const ext: ExtendedEventListing = { ...event, year: parseInt(selectedYear, 10) };
    router.push({ pathname: '/event/[code]', params: { code: event.code, data: JSON.stringify(ext) } });
  }

  const typeLabel = typeOptions.find((o) => o.value === typeFilter)?.label ?? 'All';
  const hasFilters = countryFilter !== 'All' || typeFilter !== -1;

  function clearFilters() {
    setCountryFilter('All');
    setTypeFilter(-1);
    setSearchText('');
  }

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandDark} colors={[colors.brandDark]} />
  );

  const emptyView =
    events.length > 0 && (hasFilters || isSearching) ? (
      <MessageView message="No events match your search or filters." actionLabel="Clear filters" onAction={clearFilters} />
    ) : (
      <MessageView message={`No events have been published for the ${formatSeason(selectedYear)} season yet.`} />
    );

  let content: React.ReactNode;
  if (loading) {
    content = <LoadingView />;
  } else if (error) {
    content = (
      <MessageView
        title="Couldn't load events"
        message="Check your connection and try again."
        onAction={() => loadEvents(selectedYear, true)}
      />
    );
  } else if (isSearching) {
    content = (
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => <EventRow event={item} onPress={() => navigateToEvent(item)} />}
        ListEmptyComponent={emptyView}
        contentContainerStyle={filteredEvents.length === 0 ? styles.listContent : undefined}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={refreshControl}
      />
    );
  } else {
    content = (
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.code}
        // Sticky headers in a long virtualized SectionList re-position as the next
        // section's header mounts/unmounts while scrolling, making the list jump.
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <SectionHeader
            title={`Week ${section.weekIndex + 1}`}
            subtitle={getWeekDateRange(seasonStart, section.weekIndex)}
            meta={`${section.count} ${section.count === 1 ? 'event' : 'events'}`}
            expanded={expanded.has(section.weekIndex)}
            onPress={() => toggleWeek(section.weekIndex)}
          />
        )}
        renderItem={({ item }) => <EventRow event={item} onPress={() => navigateToEvent(item)} />}
        ListEmptyComponent={emptyView}
        contentContainerStyle={filteredEvents.length === 0 ? styles.listContent : undefined}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={refreshControl}
      />
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Events"
        subtitle={gameName ? `${formatSeason(selectedYear)} · ${gameName}` : `${formatSeason(selectedYear)} season`}
        onMenu={drawer.open}
        right={
          <HeaderButton
            icon={filtersExpanded || hasFilters ? 'filter' : 'filter-outline'}
            label={filtersExpanded ? 'Hide filters' : 'Show filters'}
            onPress={() => setFiltersExpanded((v) => !v)}
          />
        }
      />

      <View style={styles.toolbar}>
        <SearchField value={searchText} onChangeText={setSearchText} placeholder="Search events, cities, or codes" />
        {filtersExpanded ? (
          <View style={styles.filtersRow}>
            <FilterButton label="Season" value={formatSeason(selectedYear)} onPress={() => setOpenPicker('season')} />
            <FilterButton label="Region" value={countryFilter} onPress={() => setOpenPicker('region')} flex={1.4} />
            <FilterButton label="Type" value={typeLabel} onPress={() => setOpenPicker('type')} flex={1.4} />
          </View>
        ) : hasFilters ? (
          <View style={styles.activeFilters}>
            <Text style={styles.activeFiltersText} numberOfLines={1}>
              Filtered: {[countryFilter !== 'All' ? countryFilter : null, typeFilter !== -1 ? typeLabel : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Pressable onPress={() => { setCountryFilter('All'); setTypeFilter(-1); }} hitSlop={8} accessibilityRole="button">
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>{content}</View>

      <PickerSheet
        visible={openPicker === 'season'}
        title="Season"
        options={[...app.seasons].reverse().map((y) => ({
          value: y, label: formatSeason(y), detail: app.seasonSummaries[y]?.gameName,
        }))}
        selected={selectedYear}
        onSelect={(v) => { setSelectedYear(v); setOpenPicker(null); }}
        onClose={() => setOpenPicker(null)}
      />
      <PickerSheet
        visible={openPicker === 'region'}
        title="Region"
        options={countryOptions.map((c) => ({ value: c, label: c }))}
        selected={countryFilter}
        onSelect={(v) => { setCountryFilter(v); setOpenPicker(null); }}
        onClose={() => setOpenPicker(null)}
      />
      <PickerSheet
        visible={openPicker === 'type'}
        title="Event Type"
        options={typeOptions.map((o) => ({ value: String(o.value), label: o.label }))}
        selected={String(typeFilter)}
        onSelect={(v) => { setTypeFilter(parseInt(v, 10)); setOpenPicker(null); }}
        onClose={() => setOpenPicker(null)}
      />
    </View>
  );
}

function FilterButton({
  label, value, onPress, flex = 1,
}: { label: string; value: string; onPress: () => void; flex?: number }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.filterButton, { flex }, pressed && styles.filterButtonPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.filterValueRow}>
        <Text style={styles.filterValue} numberOfLines={1}>{value}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  listContent: { flexGrow: 1 },
  toolbar: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  filtersRow: { flexDirection: 'row', gap: spacing.sm },
  filterButton: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.background,
  },
  filterButtonPressed: { backgroundColor: colors.pressed },
  filterLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 1 },
  filterValueRow: { flexDirection: 'row', alignItems: 'center' },
  filterValue: { flex: 1, fontSize: fontSize.secondary, color: colors.text, marginRight: 4, fontWeight: '500' },
  activeFilters: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2 },
  activeFiltersText: { flex: 1, fontSize: fontSize.secondary, color: colors.textSecondary },
  clearText: { fontSize: fontSize.secondary, color: colors.brandDark, fontWeight: '600' },
});
