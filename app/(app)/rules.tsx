import { Redirect } from 'expo-router';

/** Legacy route — rules live on the REIT Rules tab. */
export default function RulesRedirect() {
  return <Redirect href="/(app)/(tabs)/rules" />;
}
