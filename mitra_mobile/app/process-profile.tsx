
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSession } from '../shared/context/SessionContext';
import { fetchApi } from '../lib/fetchApi';
import { colors, fonts } from '../constants/theme';

const POLLING_INTERVAL = 3000; // 3 seconds

const statusMessages: { [key: string]: string } = {
  'core_processing': "Performing core calculations...",
  'generate_kundli': "Generating Kundli...",
  'process_timezone': "Processing timezone...",
  'fetch_astronomical_data': "Fetching astronomical data...",
  'fetch_dasha': "Calculating Dasha periods...",
  'calculating_sadhesati': "Calculating Sadhesati...",
  'calculating_kalasarpa': "Analyzing Kalasarpa Dosha...",
  'calculating_manglik': "Analyzing Manglik Dosha...",
  'processing_complete': "Almost there, finishing up...",
};

const ProcessProfileScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, setActiveProfile } = useSession();
  
  const [status, setStatus] = useState('Starting profile creation...');
  const [error, setError] = useState<string | null>(null);
  const [newProfileId, setNewProfileId] = useState<string | null>(null);

  const profileData = useMemo(() => {
    // Reconstruct the profile data object from search params
    return {
      name: params.name,
      dob: params.dob,
      tob: params.tob,
      pob: params.pob,
      gender: params.gender,
      relation: params.relation,
      marital_status: params.marital_status,
      occupation: params.occupation,
      occupation_details: params.occupation_details,
    };
  }, [params]);

  // 1. Initial API call to create the profile
  useEffect(() => {
    const createProfile = async () => {
      if (!token) {
        setError("Authentication token not found.");
        return;
      }
      setStatus("Submitting your details...");
      
      const { ok, data, error: apiError } = await fetchApi<{ id: string }>(
        '/api/profile/add', 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
        }
      );

      if (ok && data?.id) {
        setNewProfileId(data.id);
        setStatus("Profile created. Starting cosmic analysis...");
      } else {
        setError(apiError || "Failed to initiate profile creation.");
      }
    };

    createProfile();
  }, [token, profileData]);

  // 2. Polling for processing status
  useEffect(() => {
    if (!newProfileId) {
      return; // Don't start polling until we have a profile ID
    }

    const intervalId = setInterval(async () => {
      const { ok, data, error: apiError } = await fetchApi<{ status: string, ready: boolean }>(
        `/api/profile/status/${newProfileId}`
      );

      if (ok && data) {
        const message = statusMessages[data.status] || "Processing...";
        setStatus(message);

        if (data.ready) {
          clearInterval(intervalId);
          setStatus("Profile processed successfully!");
          
          // Set this new profile as active and navigate
          const success = await setActiveProfile(newProfileId);
          if(success) {
            router.replace('/profile'); 
          } else {
            setError("Could not set the new profile as active. Please select it from the profile list.");
          }
        }
      } else {
        setError(apiError || `An error occurred during processing.`);
        clearInterval(intervalId);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [newProfileId, router, setActiveProfile]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creating Your Cosmic Profile</Text>
      <ActivityIndicator size="large" color={colors['neon-cyan']} style={styles.spinner} />
      <Text style={styles.statusText}>{status}</Text>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHelpText}>You can manage your profiles from the main menu.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors['neo-dark'],
    padding: 24,
  },
  title: {
    fontFamily: fonts.orbitron,
    fontSize: 26,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  spinner: {
    marginBottom: 24,
  },
  statusText: {
    fontFamily: fonts.poppins,
    fontSize: 18,
    color: colors['neon-cyan'],
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.input,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: fonts.poppins,
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHelpText: {
    fontFamily: fonts.poppins,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  }
});

export default ProcessProfileScreen;
