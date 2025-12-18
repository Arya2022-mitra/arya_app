
import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../constants/theme';

export default function AddProfile() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [tobHour, setTobHour] = useState('');
  const [tobMinute, setTobMinute] = useState('');
  const [tobPeriod, setTobPeriod] = useState('AM');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [relationship, setRelationship] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [occupation, setOccupation] = useState('');
  const [studentLevel, setStudentLevel] = useState('');

  const handleSubmit = () => {
    // Handle form submission
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Profile</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>First Name:</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Last Name:</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter last name"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Gender:</Text>
        <Picker
          selectedValue={gender}
          style={styles.picker}
          onValueChange={(itemValue) => setGender(itemValue)}
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
          <Picker.Item label="Other" value="Other" />
        </Picker>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date of Birth:</Text>
        <TextInput
            style={styles.input}
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Time of Birth:</Text>
        <View style={styles.timeContainer}>
          <Picker
            selectedValue={tobHour}
            style={styles.timePicker}
            onValueChange={(itemValue) => setTobHour(itemValue)}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
              <Picker.Item key={hour} label={hour.toString()} value={hour.toString()} />
            ))}
          </Picker>
          <Picker
            selectedValue={tobMinute}
            style={styles.timePicker}
            onValueChange={(itemValue) => setTobMinute(itemValue)}
          >
            {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
              <Picker.Item key={minute} label={minute.toString().padStart(2, '0')} value={minute.toString().padStart(2, '0')} />
            ))}
          </Picker>
          <Picker
            selectedValue={tobPeriod}
            style={styles.timePicker}
            onValueChange={(itemValue) => setTobPeriod(itemValue)}
          >
            <Picker.Item label="AM" value="AM" />
            <Picker.Item label="PM" value="PM" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Place of Birth:</Text>
        <TextInput
          style={styles.input}
          value={placeOfBirth}
          onChangeText={setPlaceOfBirth}
          placeholder="Enter place of birth"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Relationship:</Text>
        <Picker
          selectedValue={relationship}
          style={styles.picker}
          onValueChange={(itemValue) => setRelationship(itemValue)}
        >
          <Picker.Item label="Select Relationship" value="" />
          <Picker.Item label="Self" value="self" />
          <Picker.Item label="Mother" value="mother" />
          <Picker.Item label="Father" value="father" />
          <Picker.Item label="Sibling" value="sibling" />
          <Picker.Item label="Child" value="child" />
          <Picker.Item label="Friend" value="friend" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Marital Status:</Text>
        <Picker
          selectedValue={maritalStatus}
          style={styles.picker}
          onValueChange={(itemValue) => setMaritalStatus(itemValue)}
        >
          <Picker.Item label="Select Marital Status" value="" />
          <Picker.Item label="Single" value="single" />
          <Picker.Item label="Married" value="married" />
          <Picker.Item label="Divorced" value="divorced" />
          <Picker.Item label="Widowed" value="widowed" />
        </Picker>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Occupation:</Text>
        <Picker
          selectedValue={occupation}
          style={styles.picker}
          onValueChange={(itemValue) => setOccupation(itemValue)}
        >
          <Picker.Item label="Select Occupation" value="" />
          <Picker.Item label="Student" value="Student" />
          <Picker.Item label="Employed" value="Employed" />
          <Picker.Item label="Self-Employed" value="Self-Employed" />
          <Picker.Item label="Home Maker" value="Home Maker" />
          <Picker.Item label="Other" value="Other" />
        </Picker>
      </View>

      {occupation === 'Student' && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Student Level:</Text>
          <TextInput
            style={styles.input}
            value={studentLevel}
            onChangeText={setStudentLevel}
            placeholder="Enter student level"
          />
        </View>
      )}

      <Button title="Submit" onPress={handleSubmit} />
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: fonts.sanskrit,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
    fontFamily: fonts.poppins,
  },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    padding: 12,
    borderRadius: 8,
    fontFamily: fonts.poppins,
  },
  picker: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timePicker: {
    width: '30%',
    backgroundColor: colors.input,
    color: colors.text,
  },
});
