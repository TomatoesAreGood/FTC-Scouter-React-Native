import {
  ActivityIndicator, FlatList, Modal, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { fetchEvents } from '../../lib/api';
import { EventListing, ExtendedEventListing } from '../../lib/models';
import { YEARS, COUNTRIES, EVENT_TYPE_OPTIONS, SEASON_START_DATES, APP_GREEN } from '../../lib/constants';
import { mergeSortByDate, splitWeeks, getWeekDateRange } from '../../lib/utils';
import DrawerMenu from '../../components/DrawerMenu';

export default function EventsScreen() {
  const router = useRouter();
  const app = useApp();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(app.eventsYear);
  const [countryFilter, setCountryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState(-1);
  const [searchText, setSearchText] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [events, setEvents] = useState<EventListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Picker modal state
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);

  async function loadEvents(year: string, forceRefresh = false) {
    if (!forceRefresh && app.yearlyEventListings[year]) {
      setEvents(app.yearlyEventListings[year]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents(year, app.user, app.token);
      app.setYearlyEventListings(year, data);
      setEvents(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load events');
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
    loadEvents(selectedYear);
    app.setEventsYear(selectedYear);
  }, [selectedYear]);

  function getFilteredEvents(): EventListing[] {
    let list = [...events];
    if (countryFilter !== 'All') list = list.filter((e) => e.country === countryFilter);
    if (typeFilter !== -1) list = list.filter((e) => e.type === typeFilter);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    return list;
  }

  function navigateToEvent(event: EventListing) {
    const ext: ExtendedEventListing = { ...event, year: parseInt(selectedYear) };
    router.push({ pathname: '/event/[code]', params: { code: event.code, data: JSON.stringify(ext) } });
  }

  const filteredEvents = getFilteredEvents();
  const isSearching = searchText.trim().length > 0;

  const seasonStart = SEASON_START_DATES[selectedYear];
  let weeks: EventListing[][] = [];
  if (!isSearching) {
    const sorted = [...filteredEvents];
    mergeSortByDate(sorted);
    weeks = splitWeeks(seasonStart, sorted);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* AppBar */}
      <View style={styles.appBar}>
        <Pressable onPress={() => setDrawerOpen(true)} style={styles.appBarBtn}>
          <Ionicons name="menu" size={26} color="#000" />
        </Pressable>
        <Text style={styles.appBarTitle}>Events</Text>
        <Pressable onPress={() => setFiltersExpanded((v) => !v)} style={styles.appBarBtn}>
          <Ionicons name="filter" size={24} color="#000" />
        </Pressable>
      </View>

      {/* Filters */}
      {filtersExpanded && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersRow}>
            <DropdownButton
              label="Season"
              value={selectedYear}
              onPress={() => setYearModalVisible(true)}
              flex={1}
            />
            <DropdownButton
              label="Region"
              value={countryFilter}
              onPress={() => setCountryModalVisible(true)}
              flex={2}
            />
            <DropdownButton
              label="Type"
              value={EVENT_TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? 'All'}
              onPress={() => setTypeModalVisible(true)}
              flex={2}
            />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2a7a2a" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => loadEvents(selectedYear)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : isSearching ? (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <EventListItem event={item} onPress={() => navigateToEvent(item)} />
          )}
          ListEmptyComponent={<EmptyState text="No events found" />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <WeeksList
          weeks={weeks}
          seasonStart={seasonStart}
          onPressEvent={navigateToEvent}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Picker modals */}
      <PickerModal
        visible={yearModalVisible}
        options={YEARS.map((y) => ({ value: y, label: y }))}
        selected={selectedYear}
        onSelect={(v) => { setSelectedYear(v); setYearModalVisible(false); }}
        onClose={() => setYearModalVisible(false)}
        title="Select Season"
      />
      <PickerModal
        visible={countryModalVisible}
        options={COUNTRIES.map((c) => ({ value: c, label: c }))}
        selected={countryFilter}
        onSelect={(v) => { setCountryFilter(v); setCountryModalVisible(false); }}
        onClose={() => setCountryModalVisible(false)}
        title="Select Region"
      />
      <PickerModal
        visible={typeModalVisible}
        options={EVENT_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
        selected={String(typeFilter)}
        onSelect={(v) => { setTypeFilter(parseInt(v)); setTypeModalVisible(false); }}
        onClose={() => setTypeModalVisible(false)}
        title="Select Type"
      />
    </SafeAreaView>
  );
}

function WeeksList({
  weeks, seasonStart, onPressEvent, refreshing, onRefresh,
}: {
  weeks: EventListing[][];
  seasonStart: string;
  onPressEvent: (e: EventListing) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const nonEmptyWeeks = weeks.map((w, i) => ({ week: w, index: i })).filter((w) => w.week.length > 0);

  if (nonEmptyWeeks.length === 0) {
    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.centered}
      >
        <EmptyState text="No events found" />
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={nonEmptyWeeks}
      keyExtractor={(item) => String(item.index)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <WeekSection
          weekNum={item.index + 1}
          dateRange={getWeekDateRange(seasonStart, item.index + 1)}
          events={item.week}
          onPressEvent={onPressEvent}
        />
      )}
    />
  );
}

function WeekSection({
  weekNum, dateRange, events, onPressEvent,
}: {
  weekNum: number;
  dateRange: string;
  events: EventListing[];
  onPressEvent: (e: EventListing) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.weekSection}>
      <Pressable style={styles.weekHeader} onPress={() => setExpanded((v) => !v)}>
        <View style={styles.weekHeaderLeft}>
          <Text style={styles.weekTitle}>Week {weekNum}</Text>
          <Text style={styles.weekSubtitle}>{dateRange}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#555" />
      </Pressable>
      {expanded && (
        <View>
          <View style={styles.dividerBlack} />
          {events.map((e) => (
            <EventListItem key={e.code} event={e} onPress={() => onPressEvent(e)} />
          ))}
        </View>
      )}
    </View>
  );
}

function EventListItem({ event, onPress }: { event: EventListing; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.listItem}>
      <Text style={styles.listItemTitle} numberOfLines={1}>{event.name}</Text>
      <View style={styles.listItemRow}>
        <Text style={styles.listItemSub}>{event.city}, {event.country}</Text>
        <Text style={styles.listItemSub}>{event.dateStart}</Text>
      </View>
      <View style={styles.dividerBlack} />
    </Pressable>
  );
}

function DropdownButton({ label, value, onPress, flex }: { label: string; value: string; onPress: () => void; flex: number }) {
  return (
    <TouchableOpacity style={[styles.dropdown, { flex }]} onPress={onPress}>
      <Text style={styles.dropdownLabel}>{label}</Text>
      <View style={styles.dropdownValueRow}>
        <Text style={styles.dropdownValue} numberOfLines={1}>{value}</Text>
        <Ionicons name="chevron-down" size={14} color="#555" />
      </View>
    </TouchableOpacity>
  );
}

function PickerModal({
  visible, options, selected, onSelect, onClose, title,
}: {
  visible: boolean;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  title: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View style={styles.modalSheet}>
        <Text style={styles.modalTitle}>{title}</Text>
        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.modalOption, item.value === selected && styles.modalOptionSelected]}
              onPress={() => onSelect(item.value)}
            >
              <Text style={[styles.modalOptionText, item.value === selected && styles.modalOptionTextSelected]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>
      </View>
    </Modal>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.emptyText}>{text}</Text>
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
    paddingHorizontal: 8,
  },
  appBarBtn: { padding: 8 },
  appBarTitle: { flex: 1, fontSize: 18, fontWeight: '600', marginLeft: 4 },
  filtersContainer: { backgroundColor: '#f5f5f5', padding: 12 },
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dropdown: { backgroundColor: '#fff', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#ccc' },
  dropdownLabel: { fontSize: 11, color: '#666', marginBottom: 2 },
  dropdownValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownValue: { fontSize: 13, color: '#000', flex: 1, marginRight: 4 },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { fontSize: 15, color: '#c00', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#90EE90', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { fontSize: 15 },
  emptyText: { fontSize: 16, color: '#666' },
  weekSection: { marginBottom: 2 },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  weekHeaderLeft: { flex: 1 },
  weekTitle: { fontSize: 16, fontWeight: '600' },
  weekSubtitle: { fontSize: 12, color: '#555', fontStyle: 'italic' },
  listItem: { paddingHorizontal: 16, paddingVertical: 10 },
  listItemTitle: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  listItemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  listItemSub: { fontSize: 13, color: '#555' },
  dividerBlack: { height: 1, backgroundColor: '#000' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#fff',
    maxHeight: '60%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 8, paddingHorizontal: 16 },
  modalOption: { paddingHorizontal: 20, paddingVertical: 14 },
  modalOptionSelected: { backgroundColor: '#e8f5e9' },
  modalOptionText: { fontSize: 15, color: '#000' },
  modalOptionTextSelected: { fontWeight: '600', color: '#2a7a2a' },
});
