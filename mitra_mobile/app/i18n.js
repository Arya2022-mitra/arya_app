"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var i18next_1 = __importDefault(require("i18next"));
var react_i18next_1 = require("react-i18next");
var en_json_1 = __importDefault(require("./locales/en.json"));
i18next_1.default.use(react_i18next_1.initReactI18next).init({
    compatibilityJSON: 'v4',
    resources: {
        en: { translation: en_json_1.default },
    },
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
});
exports.default = i18next_1.default;
