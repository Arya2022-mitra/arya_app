import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../constants/theme';

interface HamburgerButtonProps {
  onPress: () => void;
}

export default function HamburgerButton({ onPress }: HamburgerButtonProps) {
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity
      accessibilityLabel={t('nav.openMenu')}
      onPress={onPress}
      style={styles.button}
    >
      <View style={styles.line} />
      <View style={styles.line} />
      <View style={styles.line} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
  line: {
    width: 24,
    height: 2,
    backgroundColor: colors.text,
    marginBottom: 5,
  },
});
