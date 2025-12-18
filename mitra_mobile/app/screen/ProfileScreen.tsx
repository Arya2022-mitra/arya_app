import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ProfileCard from '../components/ProfileCard';
import { colors, fonts } from '../styles/theme';

// Mock data for profiles
const mockProfiles = [
  {
    id: '1',
    first_name: 'Astro',
    last_name: 'User',
    dob: '1990-01-01',
    tob: '12:00',
    moonSign: 'Aries',
    lagna: 'Leo',
    nakshatra: 'Ashwini',
  },
  {
    id: '2',
    first_name: 'Cosmic',
    last_name: 'Traveler',
    dob: '1985-05-15',
    tob: '06:30',
    moonSign: 'Taurus',
    lagna: 'Virgo',
    nakshatra: 'Rohini',
  },
];

const ProfileScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const beginJourney = (profile: any) => {
    // Navigate to the Chat screen with the selected profile
    // In a real app, you would set the active profile in your state management
    router.push({ pathname: '/chat', params: { profileId: profile.id } });
  };

  const handleAddProfile = () => {
    // Navigate to a screen to add a new profile
    // router.push('/add-profile');
    console.log('Navigate to Add Profile screen');
  };

  const handleEditProfile = (profile: any) => {
    // Navigate to a screen to edit the selected profile
    // router.push(`/edit-profile/${profile.id}`);
    console.log('Navigate to Edit Profile screen', profile.id);
  };

  const handleDeleteProfile = (profile: any) => {
    // Handle profile deletion logic
    console.log('Delete profile', profile.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profile.title')}</Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddProfile}>
        <Text style={styles.addButtonText}>{t('profile.add')}</Text>
      </TouchableOpacity>
      <FlatList
        data={mockProfiles}
        renderItem={({ item }) => (
          <ProfileCard
            profile={item}
            onPress={() => beginJourney(item)}
            onEdit={() => handleEditProfile(item)}
            onDelete={() => handleDeleteProfile(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginVertical: 16,
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
  listContainer: {
    paddingBottom: 16,
  },
});

export default ProfileScreen;
