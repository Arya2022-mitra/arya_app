"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var theme_1 = require("../../constants/theme");
var ProfileCard = function (_a) {
    var profile = _a.profile, onPress = _a.onPress, onEdit = _a.onEdit, onDelete = _a.onDelete;
    return (<react_native_1.View style={styles.card}>
      <react_native_1.TouchableOpacity onPress={onPress}>
        <react_native_1.Text style={styles.name}>{"".concat(profile.first_name, " ").concat(profile.last_name)}</react_native_1.Text>
        <react_native_1.Text style={styles.detail}>Date of Birth: {profile.dob}</react_native_1.Text>
        <react_native_1.Text style={styles.detail}>Time of Birth: {profile.tob}</react_native_1.Text>
        <react_native_1.Text style={styles.detail}>Rashi: {profile.moonSign}</react_native_1.Text>
        <react_native_1.Text style={styles.detail}>Lagna: {profile.lagna}</react_native_1.Text>
        <react_native_1.Text style={styles.detail}>Birth Star: {profile.nakshatra}</react_native_1.Text>
      </react_native_1.TouchableOpacity>
      <react_native_1.View style={styles.buttonContainer}>
        <react_native_1.TouchableOpacity style={styles.button} onPress={onEdit}>
          <react_native_1.Text style={styles.buttonText}>Edit</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={onDelete}>
          <react_native_1.Text style={styles.buttonText}>Delete</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </react_native_1.View>);
};
var styles = react_native_1.StyleSheet.create({
    card: {
        backgroundColor: theme_1.colors['deep-blue'],
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    name: {
        color: theme_1.colors.text,
        fontSize: 20,
        fontFamily: theme_1.fonts.poppins,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    detail: {
        color: theme_1.colors.text,
        fontSize: 16,
        fontFamily: theme_1.fonts.poppins,
        marginBottom: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    button: {
        backgroundColor: theme_1.colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginLeft: 8,
    },
    deleteButton: {
        backgroundColor: theme_1.colors.danger,
    },
    buttonText: {
        color: theme_1.colors.text,
        fontSize: 14,
        fontFamily: theme_1.fonts.poppins,
    },
});
exports.default = ProfileCard;
