import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExtendedEventListing, ExtendedTeamListing } from '../../lib/models';
import { APP_GREEN } from '../../lib/constants';
import { getDisplayLocation } from '../../lib/utils';
import DrawerMenu from '../../components/DrawerMenu';

export default function FavoritesScreen() {
  const router = useRouter();
  const app = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function navigateToEvent(event: ExtendedEventListing) {
    router.push({ pathname: '/event/[code]', params: { code: event.code, data: JSON.stringify(event) } });
  }

  function navigateToTeam(team: ExtendedTeamListing) {
    router.push({ pathname: '/team/[number]', params: { number: String(team.teamNumber), data: JSON.stringify(team) } });
  }

  const isEmpty = app.favoritedEvents.length === 0 && app.favoritedTeams.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <View style={styles.appBar}>
        <Pressable onPress={() => setDrawerOpen(true)} style={styles.appBarBtn}>
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </Pressable>
        <Text style={styles.appBarTitle}>Favorited</Text>
      </View>

      {isEmpty ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Favorited events and teams will show up here</Text>
        </View>
      ) : (
        <ScrollView>
          {app.favoritedEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionPad} />
              <Text style={styles.sectionTitle}>Events</Text>
              <View style={styles.sectionDivider} />
              {app.favoritedEvents.map((event) => (
                <View key={`${event.code}-${event.year}`}>
                  <Pressable style={styles.listItem} onPress={() => navigateToEvent(event)}>
                    <Text style={styles.listItemTitle} numberOfLines={1}>{event.name}</Text>
                    <View style={styles.listItemRow}>
                      <Text style={styles.listItemSub}>{event.city}, {event.country}</Text>
                      <Text style={styles.listItemSub}>{event.dateStart}</Text>
                    </View>
                  </Pressable>
                  <View style={styles.itemDivider} />
                </View>
              ))}
            </View>
          )}

          {app.favoritedTeams.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionPad} />
              <Text style={styles.sectionTitle}>Teams</Text>
              <View style={styles.sectionDivider} />
              {app.favoritedTeams.map((team) => (
                <View key={`${team.teamNumber}-${team.rookieYear}`}>
                  <Pressable style={styles.teamItem} onPress={() => navigateToTeam(team)}>
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
                  <View style={styles.itemDivider} />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
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
    paddingHorizontal: 8,
  },
  appBarBtn: { padding: 8 },
  menuIcon: { width: 24, justifyContent: 'center', gap: 5 },
  menuLine: { height: 2, backgroundColor: '#000', borderRadius: 1 },
  appBarTitle: { flex: 1, fontSize: 18, fontWeight: '600', marginLeft: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center' },
  section: {},
  sectionPad: { height: 8 },
  sectionTitle: { fontSize: 22, paddingHorizontal: 16, paddingVertical: 4 },
  sectionDivider: { height: 6, backgroundColor: '#ADD8E6' },
  listItem: { paddingHorizontal: 16, paddingVertical: 10 },
  listItemTitle: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  listItemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  listItemSub: { fontSize: 13, color: '#555' },
  itemDivider: { height: 1, backgroundColor: '#000' },
  teamItem: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  teamNumberBox: { width: 80, alignItems: 'center' },
  teamNumber: { fontSize: 21, fontWeight: '500' },
  teamInfo: { flex: 1 },
  teamName: { fontSize: 15 },
  teamLocation: { fontSize: 12, color: '#555', fontStyle: 'italic' },
});
