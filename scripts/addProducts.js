// Script to add initial product data to Firestore
// Run this once to populate the product master

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration - update with your credentials
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const products = [
    { name: "CPU", code: "DT" },
    { name: "Desktop/Monitor", code: "TFT" },
    { name: "Mouse", code: "103" },
    { name: "Keyboard", code: "104" },
    { name: "Laptop", code: "LP" },
    { name: "Adaptor", code: "ADP" },
    { name: "Printer", code: "PRI" },
    { name: "Scanner", code: "SCAN" },
    { name: "Mobile", code: "MOB" },
    { name: "CCTV Camera", code: "CAM" },
    { name: "CCTV", code: "NVR" },
    { name: "Biomax", code: "BIO" },
    { name: "Firewall", code: "FW" },
    { name: "Server", code: "SVR" },
    { name: "All In One", code: "115" },
    { name: "Switch", code: "SWI" },
    { name: "Router", code: "ROU" },
    { name: "Webcam", code: "WEB" },
    { name: "NAS Box", code: "NAS" },
    { name: "Mobile Charger", code: "MCHG" },
    { name: "TAB", code: "TAB" },
    { name: "External HDD", code: "EHDD" },
    { name: "Headset", code: "123" },
    { name: "Weighing Machine", code: "124" },
    { name: "Note Counting Machine", code: "125" },
    { name: "Landline Phone", code: "TEL" },
    { name: "Access Point", code: "AP" },
    { name: "Guardwell Vault", code: "128" },
    { name: "UPS", code: "UPS" },
    { name: "UPS Battery", code: "UPSB" },
    { name: "HDD", code: "131" },
    { name: "SSD", code: "132" },
    { name: "Alarm System", code: "AS" },
    { name: "IPAD", code: "IPAD" },
    { name: "IPAD Charger", code: "IPADC" }
];

async function addProducts() {
    console.log('Starting to add products...');

    for (const product of products) {
        try {
            await addDoc(collection(db, 'products'), {
                name: product.name,
                code: product.code,
                createdAt: serverTimestamp()
            });
            console.log(`✓ Added: ${product.name} (${product.code})`);
        } catch (error) {
            console.error(`✗ Failed to add ${product.name}:`, error);
        }
    }

    console.log('\nAll products have been added!');
    process.exit(0);
}

addProducts();
