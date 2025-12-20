import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import { firebaseConfig } from './firebaseConfig.shared';

if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

export const app = firebase;
export const authInstance = auth();
export { firebaseConfig };
