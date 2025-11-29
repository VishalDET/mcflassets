import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import { toast } from "react-toastify";

const DatabaseContext = createContext();

export function useDatabase() {
    return useContext(DatabaseContext);
}

export function DatabaseProvider({ children }) {
    const [companies, setCompanies] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Companies
    useEffect(() => {
        const q = query(collection(db, "companies"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCompanies(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching companies:", error);
            toast.error("Failed to fetch companies");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch Products
    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(data);
        }, (error) => {
            console.error("Error fetching products:", error);
            toast.error("Failed to fetch products");
        });

        return () => unsubscribe();
    }, []);

    // Company Operations
    async function addCompany(companyData) {
        try {
            await addDoc(collection(db, "companies"), {
                ...companyData,
                createdAt: serverTimestamp()
            });
            toast.success("Company added successfully");
        } catch (error) {
            console.error("Error adding company:", error);
            toast.error("Failed to add company");
            throw error;
        }
    }

    async function updateCompany(id, companyData) {
        try {
            const docRef = doc(db, "companies", id);
            await updateDoc(docRef, {
                ...companyData,
                updatedAt: serverTimestamp()
            });
            toast.success("Company updated successfully");
        } catch (error) {
            console.error("Error updating company:", error);
            toast.error("Failed to update company");
            throw error;
        }
    }

    async function deleteCompany(id) {
        try {
            await deleteDoc(doc(db, "companies", id));
            toast.success("Company deleted successfully");
        } catch (error) {
            console.error("Error deleting company:", error);
            toast.error("Failed to delete company");
            throw error;
        }
    }

    // Product Operations
    async function addProduct(productData) {
        try {
            await addDoc(collection(db, "products"), {
                ...productData,
                createdAt: serverTimestamp()
            });
            toast.success("Product added successfully");
        } catch (error) {
            console.error("Error adding product:", error);
            toast.error("Failed to add product");
            throw error;
        }
    }

    async function updateProduct(id, currentData) {
        try {
            const docRef = doc(db, "products", id);
            await updateDoc(docRef, {
                ...currentData,
                updatedAt: serverTimestamp()
            });
            toast.success("Product updated successfully");
        } catch (error) {
            console.error("Error updating product:", error);
            toast.error("Failed to update product");
            throw error;
        }
    }

    async function deleteProduct(id) {
        try {
            await deleteDoc(doc(db, "products", id));
            toast.success("Product deleted successfully");
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Failed to delete product");
            throw error;
        }
    }

    const value = {
        companies,
        products,
        loading,
        addCompany,
        updateCompany,
        deleteCompany,
        addProduct,
        updateProduct,
        deleteProduct
    };

    return (
        <DatabaseContext.Provider value={value}>
            {children}
        </DatabaseContext.Provider>
    );
}
