import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../../../constants/theme';

// Mock data for profiles
const mockProfiles = [
  {
    id: '1',
    first_name: 'Astro',
    last_name: 'User',
  },
  {
    id: '2',
    first_name: 'Cosmic',
    last_name: 'Traveler',
  },
];

export default function ProfileList() {
  const { t } = useTranslation();

  const handleAddProfile = () => {
    // Navigate to a screen to add a new profile
    console.log('Navigate to Add Profile screen');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('nav.profiles')}</Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddProfile}>
        <Text style={styles.addButtonText}>{t('nav.addProfile')}</Text>
      </TouchableOpacity>
      {mockProfiles.map((profile) => (
        <TouchableOpacity key={profile.id} style={styles.profileItem}>
          <Text style={styles.profileName}>
            {profile.first_name} {profile.last_name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    fontFamily: fonts.poppins,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileItem: {
    paddingVertical: 8,
  },
  profileName: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.poppins,
  },
});
