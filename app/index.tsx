import { Redirect } from 'expo-router';
import { useApp } from '../context/AppContext';

// "/" has no screen of its own; send the user to the right starting point.
export default function Index() {
  const { user, token } = useApp();
  return <Redirect href={user && token ? '/(tabs)/events' : '/(auth)/login'} />;
}
