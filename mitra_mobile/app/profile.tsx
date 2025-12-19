
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSession } from '../shared/context/SessionContext';
import { fetchApi } from '../lib/fetchApi';
import { colors, fonts } from '../constants/theme';

// Define the shape of a single profile
interface Profile {
  id: string;
  name: string;
  dob: string; 
  tob: string;
  pob: string;
  relation: string;
}

const ProfileCard = ({ profile, onSelect, onSetActive, isActive }: { profile: Profile, onSelect: () => void, onSetActive: () => void, isActive: boolean }) => (
  <TouchableOpacity style={[styles.card, isActive && styles.activeCard]} onPress={onSelect}>
    <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{profile.name}</Text>
        <Text style={styles.cardRelation}>({profile.relation})</Text>
    </View>
    <Text style={styles.cardText}>DOB: {profile.dob.split(' ')[0]}</Text>
    {!isActive && (
        <TouchableOpacity style={styles.setActiveButton} onPress={onSetActive}>
            <Text style={styles.setActiveButtonText}>Set as Active</Text>
        </TouchableOpacity>
    )}
  </TouchableOpacity>
);

const ProfileListScreen = () => {
  const router = useRouter();
  const { token, activeProfileId, setActiveProfile, logout } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    if (!token) {
        // If there's no token, no point in trying to fetch.
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const { ok, data, error: apiError } = await fetchApi<Profile[]>('/api/profile/list');
      if (ok && data) {
        setProfiles(data);
        setError(null);
      } else {
        setError(apiError || 'Failed to fetch profiles.');
        if(apiError && apiError.toLowerCase().includes('token has expired')) {
          Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [{ text: 'OK', onPress: logout }]);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  useFocusEffect(
    useCallback(() => {
      fetchProfiles();
    }, [fetchProfiles])
  );

  const handleSetActive = async (profileId: string) => {
    const success = await setActiveProfile(profileId);
    if (success) {
      Alert.alert('Profile Activated', 'This profile is now set as active.');
    } else {
      Alert.alert('Error', 'Could not set the active profile. Please try again.');
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color={colors['neon-cyan']} style={styles.centered} />;
  }

  if (error) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.button} onPress={fetchProfiles}><Text style={styles.buttonText}>Retry</Text></TouchableOpacity>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Profiles</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/add_profile')}>
        <Text style={styles.buttonText}>+ Add New Profile</Text>
      </TouchableOpacity>
      
      {profiles.length > 0 ? (
        <FlatList
          data={profiles}
          renderItem={({ item }) => (
            <ProfileCard 
              profile={item} 
              onSelect={() => router.push(`/profile/${item.id}`)}
              onSetActive={() => handleSetActive(item.id)}
              isActive={item.id === activeProfileId}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Text style={styles.emptyText}>No profiles yet. Add one to get started!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors['neo-dark'],
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors['neo-dark'],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginVertical: 16,
    fontFamily: fonts.orbitron,
  },
  button: {
    backgroundColor: colors['neon-cyan'],
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: colors['neo-dark'],
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.poppins,
  },
  listContainer: {
    paddingBottom: 16,
  },
  errorText: {
      color: colors.danger,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 16,
  },
  emptyText: {
      color: colors.textSecondary,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 40,
  },
  // Card styles
  card: {
    backgroundColor: colors.input,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeCard: {
      borderColor: colors['neon-cyan'],
      borderWidth: 2,
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fonts.poppins,
  },
  cardRelation: {
      fontSize: 14,
      fontStyle: 'italic',
      color: colors.textSecondary,
      fontFamily: fonts.poppins,
  },
  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fonts.poppins,
    marginBottom: 12,
  },
  setActiveButton: {
      backgroundColor: colors.primary, // A different color to stand out
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignSelf: 'flex-start',
  },
  setActiveButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
  }
});

export default ProfileListScreen;
