"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseConfig = void 0;
exports.getFirebaseApp = getFirebaseApp;
var app_1 = require("firebase/app");
var firebaseConfig = {
    apiKey: 'AIzaSyCP-NGVQC5iNQcoSHZGj0eKOjhKFFqZ6Q8',
    authDomain: 'mitraveda-c1c03.firebaseapp.com',
    projectId: 'mitraveda-c1c03',
    storageBucket: 'mitraveda-c1c03.appspot.com',
    messagingSenderId: '230188375703',
    appId: '1:230188375703:web:28af92dbe94651321c53d2',
    measurementId: 'G-MT17PVPXLQ',
};
exports.firebaseConfig = firebaseConfig;
var firebaseApp = null;
function getFirebaseApp() {
    if (firebaseApp)
        return firebaseApp;
    var globalApp = typeof globalThis !== 'undefined' ? globalThis.__FIREBASE_APP__ : undefined;
    if (globalApp) {
        firebaseApp = globalApp;
        return firebaseApp;
    }
    if ((0, app_1.getApps)().length > 0) {
        firebaseApp = (0, app_1.getApp)();
    }
    else {
        firebaseApp = (0, app_1.initializeApp)(firebaseConfig);
    }
    if (typeof globalThis !== 'undefined') {
        globalThis.__FIREBASE_APP__ = firebaseApp;
    }
    return firebaseApp;
}
