
import { useRouter } from 'expo-router';
import React from 'react';
import { Button, View } from 'react-native';

import theme from '../theme';

export default function Index() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
      <Button title="Login" color={theme.colors.accent} onPress={() => router.push('screens/auth')} />
    </View>
  );
}
