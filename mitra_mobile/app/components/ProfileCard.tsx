import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts } from '../../constants/theme';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  tob: string;
  moonSign: string;
  lagna: string;
  nakshatra: string;
}

interface ProfileCardProps {
  profile: Profile;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onPress, onEdit, onDelete }) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.name}>{`${profile.first_name} ${profile.last_name}`}</Text>
        <Text style={styles.detail}>Date of Birth: {profile.dob}</Text>
        <Text style={styles.detail}>Time of Birth: {profile.tob}</Text>
        <Text style={styles.detail}>Rashi: {profile.moonSign}</Text>
        <Text style={styles.detail}>Lagna: {profile.lagna}</Text>
        <Text style={styles.detail}>Birth Star: {profile.nakshatra}</Text>
      </TouchableOpacity>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onEdit}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={onDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors['deep-blue'],
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.poppins,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detail: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.poppins,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.poppins,
  },
});

export default ProfileCard;
