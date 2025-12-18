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
exports.default = ChatScreen;
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var react_i18next_1 = require("react-i18next");
var theme_1 = require("../../constants/theme");
function ChatScreen() {
    var t = (0, react_i18next_1.useTranslation)().t;
    var _a = (0, react_1.useState)([]), messages = _a[0], setMessages = _a[1];
    var _b = (0, react_1.useState)(''), inputText = _b[0], setInputText = _b[1];
    var handleSend = function () {
        if (inputText.trim().length === 0)
            return;
        var newMessage = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
        };
        setMessages(function (prevMessages) { return __spreadArray(__spreadArray([], prevMessages, true), [newMessage], false); });
        setInputText('');
        // Simulate a bot response
        setTimeout(function () {
            var botResponse = {
                id: Date.now().toString(),
                text: 'This is a bot response.',
                sender: 'bot',
            };
            setMessages(function (prevMessages) { return __spreadArray(__spreadArray([], prevMessages, true), [botResponse], false); });
        }, 1000);
    };
    return (<react_native_1.View style={styles.container}>
      <react_native_1.FlatList data={messages} keyExtractor={function (item) { return item.id; }} renderItem={function (_a) {
            var item = _a.item;
            return (<react_native_1.View style={[styles.messageContainer, item.sender === 'user' ? styles.userMessage : styles.botMessage]}>
            <react_native_1.Text style={styles.messageText}>{item.text}</react_native_1.Text>
          </react_native_1.View>);
        }}/>
      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.TextInput style={styles.input} placeholder={t('chat.typeMessage')} placeholderTextColor="#aaa" value={inputText} onChangeText={setInputText}/>
        <react_native_1.TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <react_native_1.Text style={styles.sendButtonText}>{t('chat.send')}</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.colors['neo-dark'],
    },
    messageContainer: {
        padding: 10,
        borderRadius: 10,
        marginVertical: 5,
        marginHorizontal: 10,
        maxWidth: '80%',
    },
    userMessage: {
        backgroundColor: theme_1.colors.primary,
        alignSelf: 'flex-end',
    },
    botMessage: {
        backgroundColor: theme_1.colors['deep-blue'],
        alignSelf: 'flex-start',
    },
    messageText: {
        color: '#fff',
        fontFamily: theme_1.fonts.poppins,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: theme_1.colors['accent-3'],
    },
    input: {
        flex: 1,
        backgroundColor: theme_1.colors['deep-blue'],
        color: '#fff',
        borderRadius: 20,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: theme_1.colors.primary,
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    sendButtonText: {
        color: theme_1.colors['neo-dark'],
        fontWeight: 'bold',
        fontFamily: theme_1.fonts.poppins,
    },
});
