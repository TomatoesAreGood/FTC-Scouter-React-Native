import { SectionList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { ExtendedEventListing, ExtendedTeamListing } from '../../lib/models';
import { colors } from '../../lib/theme';
import AppHeader from '../../components/AppHeader';
import { useDrawer } from '../../components/Drawer';
import SectionHeader from '../../components/SectionHeader';
import { EventRow, TeamRow } from '../../components/ListRows';
import { MessageView } from '../../components/StateViews';

type Section =
  | { key: 'events'; title: string; data: ExtendedEventListing[] }
  | { key: 'teams'; title: string; data: ExtendedTeamListing[] };

export default function FavoritesScreen() {
  const router = useRouter();
  const app = useApp();
  const drawer = useDrawer();

  function navigateToEvent(event: ExtendedEventListing) {
    router.push({ pathname: '/event/[code]', params: { code: event.code, data: JSON.stringify(event) } });
  }

  function navigateToTeam(team: ExtendedTeamListing) {
    router.push({ pathname: '/team/[number]', params: { number: String(team.teamNumber), data: JSON.stringify(team) } });
  }

  const sections: Section[] = [];
  if (app.favoritedEvents.length > 0) {
    sections.push({ key: 'events', title: 'Events', data: app.favoritedEvents });
  }
  if (app.favoritedTeams.length > 0) {
    sections.push({ key: 'teams', title: 'Teams', data: app.favoritedTeams });
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Favorites" onMenu={drawer.open} />
      {sections.length === 0 ? (
        <MessageView
          title="No favorites yet"
          message="Tap the star on any event or team to keep it here for quick access."
        />
      ) : (
        <SectionList<ExtendedEventListing | ExtendedTeamListing, Section>
          sections={sections}
          stickySectionHeadersEnabled={false}
          keyExtractor={(item) =>
            'code' in item ? `event-${item.code}-${item.year}` : `team-${item.teamNumber}`
          }
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} meta={String(section.data.length)} />
          )}
          renderItem={({ item }) =>
            'code' in item ? (
              <EventRow event={item} onPress={() => navigateToEvent(item)} />
            ) : (
              <TeamRow team={item} onPress={() => navigateToTeam(item)} />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
