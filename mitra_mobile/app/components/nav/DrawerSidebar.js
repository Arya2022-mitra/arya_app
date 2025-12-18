"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DrawerSidebar;
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var react_i18next_1 = require("react-i18next");
var ProfileList_1 = __importDefault(require("./ProfileList"));
var SegmentList_1 = __importDefault(require("./SegmentList"));
var theme_1 = require("../../../constants/theme");
function DrawerSidebar(_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose;
    var t = (0, react_i18next_1.useTranslation)().t;
    return (<react_native_1.Modal transparent={true} visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <react_native_1.TouchableOpacity style={styles.overlay} activeOpacity={1} onPressOut={onClose}>
        <react_native_1.View style={styles.sidebar}>
          <react_native_1.View style={styles.header}>
            <react_native_1.Text style={styles.headerText}>{t('nav.menu')}</react_native_1.Text>
            <react_native_1.TouchableOpacity onPress={onClose}>
              <react_native_1.Text style={styles.closeButton}>×</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
          <react_native_1.ScrollView>
            <ProfileList_1.default />
            <react_native_1.View style={styles.divider}/>
            <SegmentList_1.default />
          </react_native_1.ScrollView>
        </react_native_1.View>
      </react_native_1.TouchableOpacity>
    </react_native_1.Modal>);
}
var styles = react_native_1.StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sidebar: {
        width: '80%',
        height: '100%',
        backgroundColor: theme_1.colors["neo-dark"],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme_1.colors['accent-3'],
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme_1.colors.text,
    },
    closeButton: {
        fontSize: 24,
        color: theme_1.colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: theme_1.colors['accent-3'],
        marginVertical: 8,
    },
});
