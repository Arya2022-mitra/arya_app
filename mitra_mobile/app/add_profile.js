"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AddProfile;
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var picker_1 = require("@react-native-picker/picker");
var react_i18next_1 = require("react-i18next");
var theme_1 = require("../constants/theme");
function AddProfile() {
    var t = (0, react_i18next_1.useTranslation)().t;
    var _a = (0, react_1.useState)(''), firstName = _a[0], setFirstName = _a[1];
    var _b = (0, react_1.useState)(''), lastName = _b[0], setLastName = _b[1];
    var _c = (0, react_1.useState)(''), gender = _c[0], setGender = _c[1];
    var _d = (0, react_1.useState)(''), dob = _d[0], setDob = _d[1];
    var _e = (0, react_1.useState)(''), tobHour = _e[0], setTobHour = _e[1];
    var _f = (0, react_1.useState)(''), tobMinute = _f[0], setTobMinute = _f[1];
    var _g = (0, react_1.useState)('AM'), tobPeriod = _g[0], setTobPeriod = _g[1];
    var _h = (0, react_1.useState)(''), placeOfBirth = _h[0], setPlaceOfBirth = _h[1];
    var _j = (0, react_1.useState)(''), relationship = _j[0], setRelationship = _j[1];
    var _k = (0, react_1.useState)(''), maritalStatus = _k[0], setMaritalStatus = _k[1];
    var _l = (0, react_1.useState)(''), occupation = _l[0], setOccupation = _l[1];
    var _m = (0, react_1.useState)(''), studentLevel = _m[0], setStudentLevel = _m[1];
    var handleSubmit = function () {
        // Handle form submission
    };
    return (<react_native_1.ScrollView style={styles.container}>
      <react_native_1.Text style={styles.title}>Add Profile</react_native_1.Text>

      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.Text style={styles.label}>First Name:</react_native_1.Text>
        <react_native_1.TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Enter first name"/>
      </react_native_1.View>

      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.Text style={styles.label}>Last Name:</react_native_1.Text>
        <react_native_1.TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Enter last name"/>
      </react_native_1.View>

      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.Text style={styles.label}>Gender:</react_native_1.Text>
        <picker_1.Picker selectedValue={gender} style={styles.picker} onValueChange={function (itemValue) { return setGender(itemValue); }}>
          <picker_1.Picker.Item label="Select Gender" value=""/>
          <picker_1.Picker.Item label="Male" value="Male"/>
          <picker_1.Picker.Item label="Female" value="Female"/>
          <picker_1.Picker.Item label="Other" value="Other"/>
        </picker_1.Picker>
      </react_native_1.View>

      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.Text style={styles.label}>Date of Birth:</react_native_1.Text>
        <react_native_1.TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD"/>
      </react_native_1.View>

      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.Text style={styles.label}>Time of Birth:</react_native_1.Text>
        <react_native_1.View style={styles.timeContainer}>
          <picker_1.Picker selectedValue={tobHour} style={styles.timePicker} onValueChange={function (itemValue) { return setTobHour(itemValue); }}>
            {Array.from({ length: 12 }, function (_, i) { return i + 1; }).map(function (hour) { return (<picker_1.Picker.Item key={hour} label={hour.toString()} value={hour.toString()}/>); })}
          </picker_1.Picker>
          <picker_1.Picker selectedValue={tobMinute} style={styles.timePicker} onValueChange={function (itemValue) { return setTobMinute(itemValue); }}>
            {Array.from({ length: 60 }, function (_, i) { return i; }).map(function (minute) { return (<picker_1.Picker.Item key={minute} label={minute.toString().padStart(2, '0')} value={minute.toString().padStart(2, '0')}/>); })}
          </picker_1.Picker>
          <picker_1.Picker selectedValue={tobPeriod} style={styles.timePicker} onValueChange={function (itemValue) { return setTobPeriod(itemValue); }}>
            <picker_1.Picker.Item label="AM" value="AM"/>
            <picker_1.Picker.Item label="PM" value="PM"/>
          </picker_1.Picker>
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.Text style={styles.label}>Place of Birth:</react_native_1.Text>
        <react_native_1.TextInput style={styles.input} value={placeOfBirth} onChangeText={setPlaceOfBirth} placeholder="Enter place of birth"/>
      </react_native_1.View>

      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.Text style={styles.label}>Relationship:</react_native_1.Text>
        <picker_1.Picker selectedValue={relationship} style={styles.picker} onValueChange={function (itemValue) { return setRelationship(itemValue); }}>
          <picker_1.Picker.Item label="Select Relationship" value=""/>
          <picker_1.Picker.Item label="Self" value="self"/>
          <picker_1.Picker.Item label="Mother" value="mother"/>
          <picker_1.Picker.Item label="Father" value="father"/>
          <picker_1.Picker.Item label="Sibling" value="sibling"/>
          <picker_1.Picker.Item label="Child" value="child"/>
          <picker_1.Picker.Item label="Friend" value="friend"/>
          <picker_1.Picker.Item label="Other" value="other"/>
        </picker_1.Picker>
      </react_native_1.View>

      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.Text style={styles.label}>Marital Status:</react_native_1.Text>
        <picker_1.Picker selectedValue={maritalStatus} style={styles.picker} onValueChange={function (itemValue) { return setMaritalStatus(itemValue); }}>
          <picker_1.Picker.Item label="Select Marital Status" value=""/>
          <picker_1.Picker.Item label="Single" value="single"/>
          <picker_1.Picker.Item label="Married" value="married"/>
          <picker_1.Picker.Item label="Divorced" value="divorced"/>
          <picker_1.Picker.Item label="Widowed" value="widowed"/>
        </picker_1.Picker>
      </react_native_1.View>

      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.Text style={styles.label}>Occupation:</react_native_1.Text>
        <picker_1.Picker selectedValue={occupation} style={styles.picker} onValueChange={function (itemValue) { return setOccupation(itemValue); }}>
          <picker_1.Picker.Item label="Select Occupation" value=""/>
          <picker_1.Picker.Item label="Student" value="Student"/>
          <picker_1.Picker.Item label="Employed" value="Employed"/>
          <picker_1.Picker.Item label="Self-Employed" value="Self-Employed"/>
          <picker_1.Picker.Item label="Home Maker" value="Home Maker"/>
          <picker_1.Picker.Item label="Other" value="Other"/>
        </picker_1.Picker>
      </react_native_1.View>

      {occupation === 'Student' && (<react_native_1.View style={styles.inputContainer}>
          <react_native_1.Text style={styles.label}>Student Level:</react_native_1.Text>
          <react_native_1.TextInput style={styles.input} value={studentLevel} onChangeText={setStudentLevel} placeholder="Enter student level"/>
        </react_native_1.View>)}

      <react_native_1.Button title="Submit" onPress={handleSubmit}/>
    </react_native_1.ScrollView>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: theme_1.colors['neo-dark'],
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme_1.colors.text,
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: theme_1.fonts.sanskrit,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        color: theme_1.colors.text,
        marginBottom: 8,
        fontFamily: theme_1.fonts.poppins,
    },
    input: {
        backgroundColor: theme_1.colors.input,
        color: theme_1.colors.text,
        padding: 12,
        borderRadius: 8,
        fontFamily: theme_1.fonts.poppins,
    },
    picker: {
        backgroundColor: theme_1.colors.input,
        color: theme_1.colors.text,
        borderRadius: 8,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timePicker: {
        width: '30%',
        backgroundColor: theme_1.colors.input,
        color: theme_1.colors.text,
    },
});
