import {
  ActivityIndicator, Alert, FlatList, Modal, Pressable,
  RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { fetchTeamsPage, searchTeamByNumber } from '../../lib/api';
import { TeamListing, ExtendedTeamListing } from '../../lib/models';
import { YEARS, APP_GREEN } from '../../lib/constants';
import { getDisplayLocation } from '../../lib/utils';
import DrawerMenu from '../../components/DrawerMenu';

export default function TeamsScreen() {
  const router = useRouter();
  const app = useApp();
  const listRef = useRef<FlatList>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(app.teamsYear);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [teams, setTeams] = useState<TeamListing[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageTotal, setPageTotal] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function loadTeams(year: string, page: number, append = false) {
    if (app.yearlyTeamListings[year] && page <= app.yearlyTeamListings[year].page && !append) {
      setTeams(app.yearlyTeamListings[year].teams);
      setCurrentPage(app.yearlyTeamListings[year].page);
      return;
    }
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const result = await fetchTeamsPage(year, page, app.user, app.token);
      setPageTotal(result.pageTotal);
      if (page === 1) {
        setTeams(result.teams);
        app.setYearlyTeamListings(year, { page: 1, teams: result.teams });
      } else {
        const merged = [...teams, ...result.teams];
        setTeams(merged);
        app.appendTeamsForYear(year, result.teams, page);
      }
      setCurrentPage(page);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load teams');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadTeams(selectedYear, 1, false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadTeams(selectedYear, 1);
    app.setTeamsYear(selectedYear);
  }, [selectedYear]);

  async function handleSearch() {
    const num = parseInt(searchText.trim());
    if (isNaN(num)) {
      Alert.alert('Invalid input', 'Search query can only include numbers');
      return;
    }
    setLoading(true);
    const found = await searchTeamByNumber(selectedYear, num, app.user, app.token);
    setLoading(false);
    if (found) {
      const ext: ExtendedTeamListing = { ...found, year: parseInt(selectedYear) };
      router.push({ pathname: '/team/[number]', params: { number: String(found.teamNumber), data: JSON.stringify(ext) } });
    } else {
      Alert.alert('Not found', `Team ${num} not found in ${selectedYear}`);
    }
  }

  function navigateToTeam(team: TeamListing) {
    const ext: ExtendedTeamListing = { ...team, year: parseInt(selectedYear) };
    router.push({ pathname: '/team/[number]', params: { number: String(team.teamNumber), data: JSON.stringify(ext) } });
  }

  function onEndReached() {
    if (!loadingMore && !loading && currentPage < pageTotal) {
      loadTeams(selectedYear, currentPage + 1, true);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* AppBar */}
      <View style={styles.appBar}>
        <Pressable onPress={() => setDrawerOpen(true)} style={styles.appBarBtn}>
          <Ionicons name="menu" size={26} color="#000" />
        </Pressable>
        <Text style={styles.appBarTitle}>Teams</Text>
        <Pressable onPress={() => setFiltersExpanded((v) => !v)} style={styles.appBarBtn}>
          <Ionicons name="filter" size={24} color="#000" />
        </Pressable>
      </View>

      {/* Filters */}
      {filtersExpanded && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersRow}>
            <TouchableOpacity style={styles.dropdown} onPress={() => setYearModalVisible(true)}>
              <Text style={styles.dropdownLabel}>Season</Text>
              <View style={styles.dropdownValueRow}>
                <Text style={styles.dropdownValue}>{selectedYear}</Text>
                <Ionicons name="chevron-down" size={14} color="#555" />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by team number..."
              value={searchText}
              onChangeText={setSearchText}
              keyboardType="number-pad"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <Pressable style={styles.searchBtn} onPress={handleSearch}>
              <Ionicons name="search" size={20} color="#000" />
            </Pressable>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2a7a2a" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={teams}
          keyExtractor={(item) => String(item.teamNumber)}
          getItemLayout={(_, index) => ({ length: 55, offset: 55 * index, index })}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TeamListItem team={item} onPress={() => navigateToTeam(item)} />
          )}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} color="#2a7a2a" /> : null}
          ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No teams found</Text></View>}
        />
      )}

      {/* Scroll to top FAB */}
      {teams.length > 0 && (
        <Pressable style={styles.fab} onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}>
          <Ionicons name="arrow-up" size={24} color="#fff" />
        </Pressable>
      )}

      {/* Year picker */}
      <Modal visible={yearModalVisible} transparent animationType="slide" onRequestClose={() => setYearModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setYearModalVisible(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select Season</Text>
          {YEARS.map((y) => (
            <Pressable
              key={y}
              style={[styles.modalOption, y === selectedYear && styles.modalOptionSelected]}
              onPress={() => { setSelectedYear(y); setYearModalVisible(false); }}
            >
              <Text style={[styles.modalOptionText, y === selectedYear && styles.modalOptionTextSelected]}>{y}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TeamListItem({ team, onPress }: { team: TeamListing; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.teamItem}>
      <View style={styles.teamNumberBox}>
        <Text style={styles.teamNumber}>{team.teamNumber}</Text>
      </View>
      <View style={styles.teamInfo}>
        <Text style={styles.teamName} numberOfLines={1}>{team.teamName}</Text>
        <Text style={styles.teamLocation} numberOfLines={1}>
          {getDisplayLocation(team)}
        </Text>
      </View>
    </Pressable>
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
  filtersRow: { marginBottom: 8 },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  dropdownLabel: { fontSize: 11, color: '#666', marginBottom: 2 },
  dropdownValueRow: { flexDirection: 'row', alignItems: 'center' },
  dropdownValue: { fontSize: 13, color: '#000', marginRight: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  searchBtn: {
    backgroundColor: '#90EE90',
    borderRadius: 6,
    padding: 10,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#666' },
  teamItem: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  teamNumberBox: { width: 80, alignItems: 'center' },
  teamNumber: { fontSize: 21, fontWeight: '500' },
  teamInfo: { flex: 1 },
  teamName: { fontSize: 15 },
  teamLocation: { fontSize: 12, color: '#555', fontStyle: 'italic' },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a7a2a',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 8, paddingHorizontal: 16 },
  modalOption: { paddingHorizontal: 20, paddingVertical: 14 },
  modalOptionSelected: { backgroundColor: '#e8f5e9' },
  modalOptionText: { fontSize: 15 },
  modalOptionTextSelected: { fontWeight: '600', color: '#2a7a2a' },
});
