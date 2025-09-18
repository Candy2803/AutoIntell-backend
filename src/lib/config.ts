// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCUxOk-sc2-gfUBk_UW_oRE3JbUtXnAxso",
    authDomain: "autointell-aa9d6.firebaseapp.com",
    projectId: "autointell-aa9d6",
    storageBucket: "autointell-aa9d6.firebasestorage.app",
    messagingSenderId: "929737920656",
    appId: "1:929737920656:web:851688659f9f5977cd4815",
    measurementId: "G-CZ2CD8Q1XJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);