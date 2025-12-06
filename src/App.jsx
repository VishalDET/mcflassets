import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/Layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AssetList from "./pages/Assets/AssetList";
import AddAsset from "./pages/Assets/AddAsset";
import EditAsset from "./pages/Assets/EditAsset";
import AssetDetails from "./pages/Assets/AssetDetails";
import TransferAsset from "./pages/Transfers/TransferAsset";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import CompanyMaster from "./pages/CompanyMaster";
import CompanyDetails from "./pages/CompanyDetails";
import ProductMaster from "./pages/ProductMaster";
import SupplierMaster from "./pages/SupplierMaster";
import { DatabaseProvider } from "./context/DatabaseContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { isConfigured } from "./services/firebase";

function App() {
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Configuration Required</h1>
          <p className="mb-4 text-gray-700">
            The application is missing Firebase configuration. Please create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in the project root with your Firebase keys.
          </p>
          <p className="mb-4 text-gray-700">
            You can use <code className="bg-gray-100 px-1 rounded">.env.example</code> as a template.
          </p>
          <div className="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
            <pre className="text-sm text-gray-600">
              VITE_FIREBASE_API_KEY=...{"\n"}
              VITE_FIREBASE_AUTH_DOMAIN=...{"\n"}
              VITE_FIREBASE_PROJECT_ID=...
            </pre>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            After adding the file, restart the development server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <DatabaseProvider>
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />

              {/* Asset Management - Admin & Staff */}
              <Route path="assets" element={<AssetList />} />
              <Route path="assets/new" element={
                <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                  <AddAsset />
                </ProtectedRoute>
              } />
              <Route path="assets/:id/edit" element={
                <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                  <EditAsset />
                </ProtectedRoute>
              } />
              <Route path="assets/:id" element={<AssetDetails />} />

              {/* Transfers - Admin & Staff */}
              <Route path="transfers" element={
                <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                  <TransferAsset />
                </ProtectedRoute>
              } />

              <Route path="reports" element={<Reports />} />

              {/* Admin Only Routes */}
              <Route path="users" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="companies" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <CompanyMaster />
                </ProtectedRoute>
              } />
              <Route path="companies/:id" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <CompanyDetails />
                </ProtectedRoute>
              } />
              <Route path="products" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <ProductMaster />
                </ProtectedRoute>
              } />
              <Route path="suppliers" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <SupplierMaster />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </DatabaseProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
