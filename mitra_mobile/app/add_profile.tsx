
import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { colors, fonts } from '../constants/theme';

export default function AddProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');
  const [pob, setPob] = useState('');
  const [relation, setRelation] = useState('self');
  const [maritalStatus, setMaritalStatus] = useState('single');
  const [occupation, setOccupation] = useState('Other');
  const [occupationDetails, setOccupationDetails] = useState('');

  const handleSubmit = () => {
    // Basic validation
    if (!name || !date || !pob) {
      Alert.alert("Missing Fields", "Please fill in Name, Date of Birth, and Place of Birth.");
      return;
    }

    // Format time to 24-hour format
    let formattedHour = parseInt(hour, 10);
    if (period === 'PM' && formattedHour < 12) {
      formattedHour += 12;
    } else if (period === 'AM' && formattedHour === 12) { // Midnight case
      formattedHour = 0;
    }
    const tob = `${String(formattedHour).padStart(2, '0')}:${minute}:00`;
    const dob = `${date} ${tob}`;

    // Navigate to the processing screen with all the data in params
    router.push({
      pathname: '/process-profile',
      params: {
        name,
        dob,
        tob,
        pob,
        gender,
        relation,
        marital_status: maritalStatus,
        occupation,
        occupation_details: occupationDetails,
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Profile</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name:</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Siddhartha Gautama"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date of Birth:</Text>
        <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Time of Birth:</Text>
        <View style={styles.timeContainer}>
          <Picker selectedValue={hour} style={styles.timePicker} onValueChange={setHour} itemStyle={styles.pickerItem}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <Picker.Item key={h} label={String(h)} value={String(h)} />)}
          </Picker>
          <Picker selectedValue={minute} style={styles.timePicker} onValueChange={setMinute} itemStyle={styles.pickerItem}>
            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => <Picker.Item key={m} label={m} value={m} />)}
          </Picker>
          <Picker selectedValue={period} style={styles.timePicker} onValueChange={setPeriod} itemStyle={styles.pickerItem}>
            <Picker.Item label="AM" value="AM" />
            <Picker.Item label="PM" value="PM" />
          </Picker>
        </View>
      </View>

       <View style={styles.inputContainer}>
        <Text style={styles.label}>Place of Birth:</Text>
        <TextInput
          style={styles.input}
          value={pob}
          onChangeText={setPob}
          placeholder="e.g., Lumbini, Nepal"
          placeholderTextColor={colors.textSecondary}
        />
      </View>
      
      <View style={styles.gridContainer}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Gender:</Text>
          <Picker selectedValue={gender} style={styles.picker} onValueChange={setGender} itemStyle={styles.pickerItem}>
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Relationship:</Text>
          <Picker selectedValue={relation} style={styles.picker} onValueChange={setRelation} itemStyle={styles.pickerItem}>
            <Picker.Item label="Self" value="self" />
            <Picker.Item label="Mother" value="mother" />
            <Picker.Item label="Father" value="father" />
            <Picker.Item label="Spouse" value="spouse" />
            <Picker.Item label="Sibling" value="sibling" />
            <Picker.Item label="Child" value="child" />
            <Picker.Item label="Friend" value="friend" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Marital Status:</Text>
        <Picker selectedValue={maritalStatus} style={styles.picker} onValueChange={setMaritalStatus} itemStyle={styles.pickerItem}>
            <Picker.Item label="Single" value="single" />
            <Picker.Item label="Married" value="married" />
            <Picker.Item label="Divorced" value="divorced" />
            <Picker.Item label="Widowed" value="widowed" />
        </Picker>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Occupation:</Text>
        <Picker selectedValue={occupation} style={styles.picker} onValueChange={(v) => setOccupation(v)} itemStyle={styles.pickerItem}>
            <Picker.Item label="Student" value="Student" />
            <Picker.Item label="Employed" value="Employed" />
            <Picker.Item label="Self-Employed" value="Self-Employed" />
            <Picker.Item label="Business" value="Business" />
            <Picker.Item label="Home Maker" value="Home Maker" />
            <Picker.Item label="Retired" value="Retired" />
            <Picker.Item label="Other" value="Other" />
        </Picker>
      </View>

      {(occupation === 'Student' || occupation === 'Employed') && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Specify Details:</Text>
          <TextInput
            style={styles.input}
            value={occupationDetails}
            onChangeText={setOccupationDetails}
            placeholder={occupation === 'Student' ? "e.g., Grade 10" : "e.g., Software Engineer"}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Create Profile" onPress={handleSubmit} color={colors['neon-cyan']} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors['neo-dark'],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: fonts.orbitron,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
    fontFamily: fonts.poppins,
  },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    padding: 14,
    borderRadius: 8,
    fontFamily: fonts.poppins,
    fontSize: 16,
  },
  picker: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 8,
  },
  pickerItem: {
    color: colors.text, 
    backgroundColor: colors.input, 
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timePicker: {
    flex: 1,
    backgroundColor: colors.input,
    color: colors.text,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    flex: 0.48,
  },
  buttonContainer: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
