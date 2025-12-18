"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("@testing-library/react-native");
var ChatScreen_1 = __importDefault(require("../ChatScreen"));
jest.mock('react-i18next', function () { return ({
    useTranslation: function () { return ({
        t: function (key) { return key; },
    }); },
}); });
describe('ChatScreen', function () {
    it('renders the header and input field', function () {
        var getByPlaceholderText = (0, react_native_1.render)(<ChatScreen_1.default />).getByPlaceholderText;
        expect(getByPlaceholderText('chat.typeMessage')).toBeTruthy();
    });
    it('allows typing in the input field', function () {
        var getByPlaceholderText = (0, react_native_1.render)(<ChatScreen_1.default />).getByPlaceholderText;
        var input = getByPlaceholderText('chat.typeMessage');
        react_native_1.fireEvent.changeText(input, 'Hello, world!');
        expect(input.props.value).toBe('Hello, world!');
    });
    it('sends a message when the send button is pressed', function () {
        var _a = (0, react_native_1.render)(<ChatScreen_1.default />), getByPlaceholderText = _a.getByPlaceholderText, getByText = _a.getByText, queryByText = _a.queryByText;
        var input = getByPlaceholderText('chat.typeMessage');
        react_native_1.fireEvent.changeText(input, 'Test message');
        react_native_1.fireEvent.press(getByText('chat.send'));
        expect(queryByText('Test message')).toBeTruthy();
        expect(input.props.value).toBe('');
    });
});
