"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var theme_1 = require("../../constants/theme");
var ChatBubble = function (_a) {
    var from = _a.from, message = _a.message, timestamp = _a.timestamp;
    var isUser = from === 'user';
    return (<react_native_1.View style={[styles.container, isUser ? styles.userBubble : styles.assistantBubble]}>
      <react_native_1.Text style={styles.messageText}>{message}</react_native_1.Text>
      <react_native_1.Text style={styles.timestampText}>{timestamp}</react_native_1.Text>
    </react_native_1.View>);
};
var styles = react_native_1.StyleSheet.create({
    container: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        maxWidth: '80%',
    },
    userBubble: {
        backgroundColor: theme_1.colors.primary,
        alignSelf: 'flex-end',
    },
    assistantBubble: {
        backgroundColor: theme_1.colors['deep-blue'],
        alignSelf: 'flex-start',
    },
    messageText: {
        color: theme_1.colors.text,
        fontSize: 16,
        fontFamily: theme_1.fonts.poppins,
    },
    timestampText: {
        color: theme_1.colors.text,
        fontSize: 10,
        fontFamily: theme_1.fonts.poppins,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
});
exports.default = ChatBubble;
