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
    serverTimestamp,
    getDocs
} from "firebase/firestore";
import { getAssetsByEmployee } from "../services/db";
import { toast } from "react-toastify";

const DatabaseContext = createContext();

export function useDatabase() {
    return useContext(DatabaseContext);
}

export function DatabaseProvider({ children }) {
    const [companies, setCompanies] = useState([]);
    const [products, setProducts] = useState([]);
    const [brands, setBrands] = useState([]);
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

    // Fetch Brands
    useEffect(() => {
        const q = query(collection(db, "brands"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBrands(data);
        }, (error) => {
            console.error("Error fetching brands:", error);
            toast.error("Failed to fetch brands");
        });

        return () => unsubscribe();
    }, []);

    // Fetch Suppliers
    const [suppliers, setSuppliers] = useState([]);
    useEffect(() => {
        const q = query(collection(db, "suppliers"), orderBy("companyName"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSuppliers(data);
        }, (error) => {
            console.error("Error fetching suppliers:", error);
            toast.error("Failed to fetch suppliers");
        });

        return () => unsubscribe();
    }, []);

    // Fetch Employees
    const [employees, setEmployees] = useState([]);
    useEffect(() => {
        const q = query(collection(db, "employees"), orderBy("employeeName"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEmployees(data);
        }, (error) => {
            console.error("Error fetching employees:", error);
            toast.error("Failed to fetch employees");
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

    // Brand Operations
    async function addBrand(brandData) {
        try {
            await addDoc(collection(db, "brands"), {
                ...brandData,
                createdAt: serverTimestamp()
            });
            toast.success("Brand added successfully");
        } catch (error) {
            console.error("Error adding brand:", error);
            toast.error("Failed to add brand");
            throw error;
        }
    }

    async function updateBrand(id, currentData) {
        try {
            const docRef = doc(db, "brands", id);
            await updateDoc(docRef, {
                ...currentData,
                updatedAt: serverTimestamp()
            });
            toast.success("Brand updated successfully");
        } catch (error) {
            console.error("Error updating brand:", error);
            toast.error("Failed to update brand");
            throw error;
        }
    }

    async function deleteBrand(id) {
        try {
            await deleteDoc(doc(db, "brands", id));
            toast.success("Brand deleted successfully");
        } catch (error) {
            console.error("Error deleting brand:", error);
            toast.error("Failed to delete brand");
            throw error;
        }
    }

    // Branch Operations
    async function getBranches(companyId) {
        try {
            const q = query(
                collection(db, "companies", companyId, "branches"),
                orderBy("name")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching branches:", error);
            toast.error("Failed to fetch branches");
            return [];
        }
    }

    async function addBranch(companyId, branchData) {
        try {
            // Add branch to subcollection
            await addDoc(collection(db, "companies", companyId, "branches"), {
                ...branchData,
                createdAt: serverTimestamp()
            });

            // Update company branch count (optional but good for listing performance)
            // For now we'll just rely on fetching, but if we wanted a count on the main list we might inc a counter.
            // Let's keep it simple for now and just add the doc.

            toast.success("Branch added successfully");
        } catch (error) {
            console.error("Error adding branch:", error);
            toast.error("Failed to add branch");
            throw error;
        }
    }

    async function updateBranch(companyId, branchId, branchData) {
        try {
            const docRef = doc(db, "companies", companyId, "branches", branchId);
            await updateDoc(docRef, {
                ...branchData,
                updatedAt: serverTimestamp()
            });
            toast.success("Branch updated successfully");
        } catch (error) {
            console.error("Error updating branch:", error);
            toast.error("Failed to update branch");
            throw error;
        }
    }

    async function deleteBranch(companyId, branchId) {
        try {
            await deleteDoc(doc(db, "companies", companyId, "branches", branchId));
            toast.success("Branch deleted successfully");
        } catch (error) {
            console.error("Error deleting branch:", error);
            toast.error("Failed to delete branch");
            throw error;
        }
    }

    // Employee Operations
    async function addEmployee(employeeData) {
        try {
            await addDoc(collection(db, "employees"), {
                ...employeeData,
                createdAt: serverTimestamp()
            });
            toast.success("Employee added successfully");
        } catch (error) {
            console.error("Error adding employee:", error);
            toast.error("Failed to add employee");
            throw error;
        }
    }

    async function updateEmployee(id, employeeData) {
        try {
            const docRef = doc(db, "employees", id);
            await updateDoc(docRef, {
                ...employeeData,
                updatedAt: serverTimestamp()
            });
            toast.success("Employee updated successfully");
        } catch (error) {
            console.error("Error updating employee:", error);
            toast.error("Failed to update employee");
            throw error;
        }
    }

    async function deleteEmployee(id) {
        try {
            await deleteDoc(doc(db, "employees", id));
            toast.success("Employee deleted successfully");
        } catch (error) {
            console.error("Error deleting employee:", error);
            toast.error("Failed to delete employee");
            throw error;
        }
    }

    // Employee Asset Operations
    async function getEmployeeAssets(employeeId) {
        try {
            const assets = await getAssetsByEmployee(employeeId);
            return assets;
        } catch (error) {
            console.error("Error fetching employee assets:", error);
            toast.error("Failed to fetch employee assets");
            return [];
        }
    }

    const value = {
        companies,
        products,
        brands,
        suppliers,
        loading,
        addCompany,
        updateCompany,
        deleteCompany,
        addProduct,
        updateProduct,
        deleteProduct,
        addBrand,
        updateBrand,
        deleteBrand,
        getBranches,
        addBranch,
        updateBranch,
        deleteBranch,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        getEmployeeAssets,
        getAssetsByEmployee
    };

    return (
        <DatabaseContext.Provider value={value}>
            {children}
        </DatabaseContext.Provider>
    );
}
