import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

// Assets Collection
const ASSETS_COLLECTION = "assets";

export const addAsset = async (assetData) => {
    try {
        const docRef = await addDoc(collection(db, ASSETS_COLLECTION), {
            ...assetData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding asset: ", error);
        throw error;
    }
};

export const getAssets = async () => {
    try {
        const q = query(collection(db, ASSETS_COLLECTION), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting assets: ", error);
        throw error;
    }
};

export const getAssetById = async (id) => {
    try {
        const docRef = doc(db, ASSETS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting asset by ID: ", error);
        throw error;
    }
};

export const updateAsset = async (id, assetData) => {
    try {
        const assetRef = doc(db, ASSETS_COLLECTION, id);
        await updateDoc(assetRef, {
            ...assetData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating asset: ", error);
        throw error;
    }
};

export const deleteAsset = async (id) => {
    try {
        await deleteDoc(doc(db, ASSETS_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting asset: ", error);
        throw error;
    }
};

// Transfers Collection
const TRANSFERS_COLLECTION = "transfers";

export const addTransfer = async (transferData) => {
    try {
        const docRef = await addDoc(collection(db, TRANSFERS_COLLECTION), {
            ...transferData,
            transferDate: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding transfer: ", error);
        throw error;
    }
};

export const getAssetHistory = async (assetId) => {
    try {
        const q = query(
            collection(db, TRANSFERS_COLLECTION),
            where("assetId", "==", assetId),
            orderBy("transferDate", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting asset history: ", error);
        throw error;
    }
};

// Users Collection
const USERS_COLLECTION = "users";

export const getUsers = async () => {
    try {
        const q = query(collection(db, USERS_COLLECTION));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting users: ", error);
        throw error;
    }
};

export const addUser = async (userData) => {
    try {
        const docRef = await addDoc(collection(db, USERS_COLLECTION), {
            ...userData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding user: ", error);
        throw error;
    }
};
