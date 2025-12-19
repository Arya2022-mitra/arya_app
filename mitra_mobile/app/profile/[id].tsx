
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSession } from '../../shared/context/SessionContext';
import { fetchApi } from '../../lib/fetchApi';
import { colors, fonts } from '../../constants/theme';

interface ProfileDetails {
  id: string;
  name: string;
  dob: string;
  tob: string;
  pob: string;
  gender: string;
  relation: string;
  marital_status: string;
  occupation: string;
  occupation_details: string;
  // Add any other fields you expect from the API
  [key: string]: any;
}

const ProfileDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, logout } = useSession();

  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileDetails = useCallback(async () => {
    if (!id || !token) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const { ok, data, error: apiError } = await fetchApi<ProfileDetails>(`/api/profile/${id}`);
      if (ok && data) {
        setProfile(data);
        setError(null);
      } else {
        setError(apiError || `Failed to fetch details for profile ${id}.`);
        if(apiError && apiError.toLowerCase().includes('token has expired')) {
            Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [{ text: 'OK', onPress: logout }]);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [id, token, logout]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileDetails();
    }, [fetchProfileDetails])
  );
  
  const handleDelete = async () => {
    if(!id) return;

    Alert.alert(
        "Delete Profile",
        "Are you sure you want to delete this profile? This action cannot be undone.",
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        const { ok, error: apiError } = await fetchApi(`/api/profile/delete/${id}`, { method: 'DELETE' });
                        if (ok) {
                            Alert.alert("Success", "Profile deleted successfully.");
                            router.back(); // Go back to the list
                        } else {
                            Alert.alert("Error", apiError || "Failed to delete profile.");
                        }
                    } catch (err) {
                        Alert.alert("Error", "An unexpected error occurred during deletion.");
                    }
                },
            },
        ]
    );
  };


  if (isLoading) {
    return <ActivityIndicator size="large" color={colors['neon-cyan']} style={styles.centered} />;
  }

  if (error) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.button} onPress={fetchProfileDetails}><Text style={styles.buttonText}>Retry</Text></TouchableOpacity>
        </View>
    );
  }

  if (!profile) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>Profile not found.</Text>
        </View>
    );
  }
  
  const displayFields = {
      "Name": profile.name,
      "Date of Birth": profile.dob.split(' ')[0],
      "Time of Birth": profile.tob,
      "Place of Birth": profile.pob,
      "Gender": profile.gender,
      "Relation": profile.relation,
      "Marital Status": profile.marital_status,
      "Occupation": profile.occupation,
      ...(profile.occupation_details && { "Occupation Details": profile.occupation_details }),
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{profile.name}</Text>
      </View>

      <View style={styles.detailsContainer}>
        {Object.entries(displayFields).map(([label, value]) => (
            <View key={label} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <Text style={styles.fieldValue}>{String(value)}</Text>
            </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => Alert.alert("Edit", "Edit functionality not implemented yet.")}>
            <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
            <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors['neo-dark'],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors['neo-dark'],
    padding: 16,
  },
  header: {
    backgroundColor: colors.input,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors['neon-cyan'],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fonts.orbitron,
  },
  detailsContainer: {
      padding: 20,
  },
  fieldContainer: {
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.input,
      paddingBottom: 16,
  },
  fieldLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: fonts.poppins,
      marginBottom: 4,
  },
  fieldValue: {
      fontSize: 18,
      color: colors.text,
      fontFamily: fonts.poppins,
  },
  errorText: {
      color: colors.danger,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 16,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.poppins,
  },
  editButton: {
      backgroundColor: colors['neon-cyan'],
  },
  deleteButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.danger,
  },
  deleteButtonText: {
      color: colors.danger
  }
});

export default ProfileDetailScreen;
