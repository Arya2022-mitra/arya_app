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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Chat;
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var react_i18next_1 = require("react-i18next");
var theme_1 = require("../constants/theme");
var ChatBubble = function (_a) {
    var from = _a.from, message = _a.message, timestamp = _a.timestamp;
    return (<react_native_1.View style={[styles.bubble, from === 'user' ? styles.userBubble : styles.assistantBubble]}>
    <react_native_1.Text style={styles.messageText}>{message}</react_native_1.Text>
    <react_native_1.Text style={styles.timestamp}>{timestamp}</react_native_1.Text>
  </react_native_1.View>);
};
function Chat() {
    var t = (0, react_i18next_1.useTranslation)().t;
    var _a = (0, react_1.useState)([
        { from: 'assistant', message: 'Hello! How can I help you today?', timestamp: new Date().toLocaleTimeString() },
    ]), messages = _a[0], setMessages = _a[1];
    var _b = (0, react_1.useState)(''), input = _b[0], setInput = _b[1];
    var _c = (0, react_1.useState)(false), sending = _c[0], setSending = _c[1];
    var scrollViewRef = (0, react_1.useRef)(null);
    var sendMessage = function () {
        if (input.trim() === '')
            return;
        var timestamp = new Date().toLocaleTimeString();
        var newUserMessage = { from: 'user', message: input, timestamp: timestamp };
        setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newUserMessage], false); });
        setInput('');
        setSending(true);
        // Simulate assistant response
        setTimeout(function () {
            var assistantResponse = { from: 'assistant', message: "I received your message: \"".concat(input, "\""), timestamp: new Date().toLocaleTimeString() };
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [assistantResponse], false); });
            setSending(false);
        }, 1000);
    };
    (0, react_1.useEffect)(function () {
        var _a;
        (_a = scrollViewRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: true });
    }, [messages]);
    return (<react_native_1.KeyboardAvoidingView style={styles.container} behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={react_native_1.Platform.OS === 'ios' ? 100 : 0}>
      <react_native_1.Text style={styles.header}>🔮 MitraVeda Chat – Divine Guidance</react_native_1.Text>
      <react_native_1.ScrollView style={styles.messagesContainer} ref={scrollViewRef} onContentSizeChange={function () { var _a; return (_a = scrollViewRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: true }); }}>
        {messages.map(function (msg, idx) { return (<ChatBubble key={idx} from={msg.from} message={msg.message} timestamp={msg.timestamp}/>); })}
        {sending && <react_native_1.Text style={styles.processingText}>{t('chat.processing')}</react_native_1.Text>}
      </react_native_1.ScrollView>
      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.TextInput style={styles.input} value={input} onChangeText={setInput} placeholder={t('chat.inputPlaceholder')}/>
        <react_native_1.Button title={t('chat.send')} onPress={sendMessage} disabled={sending}/>
      </react_native_1.View>
    </react_native_1.KeyboardAvoidingView>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.colors['neo-dark'],
    },
    header: {
        padding: 24,
        textAlign: 'center',
        fontFamily: 'orbitron',
        fontSize: 18,
        color: theme_1.colors['neon-cyan'],
        borderBottomWidth: 1,
        borderBottomColor: theme_1.colors.accent,
    },
    messagesContainer: {
        flex: 1,
        padding: 16,
    },
    bubble: {
        padding: 12,
        borderRadius: 20,
        marginBottom: 12,
        maxWidth: '80%',
    },
    userBubble: {
        backgroundColor: theme_1.colors['neon-cyan'],
        alignSelf: 'flex-end',
    },
    assistantBubble: {
        backgroundColor: theme_1.colors.input,
        alignSelf: 'flex-start',
    },
    messageText: {
        color: theme_1.colors.text,
    },
    timestamp: {
        color: theme_1.colors.text,
        fontSize: 10,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    processingText: {
        textAlign: 'center',
        fontStyle: 'italic',
        color: theme_1.colors['neon-cyan'],
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: theme_1.colors.accent,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: theme_1.colors.input,
        color: theme_1.colors.text,
        padding: 12,
        borderRadius: 20,
        marginRight: 16,
    },
});
