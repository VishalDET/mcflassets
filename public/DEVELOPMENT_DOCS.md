# Asset Manager - Development Documentation

## 1. Project Overview
**Asset Manager** is a web-based application designed to track and manage IT assets across multiple companies, branches, and locations. It handles the entire lifecycle of an asset from acquisition to disposal, including assignment to employees and transfers between locations.

## 2. Technology Stack
-   **Frontend Framework**: React (Vite)
-   **Styling**: Tailwind CSS
-   **Database & Auth**: Firebase (Firestore, Authentication)
-   **Routing**: React Router DOM
-   **State Management**: React Context API
-   **Visualization**: Recharts
-   **Data Export**: SheetJS (xlsx)
-   **Icons**: Lucide React
-   **Notifications**: React Toastify

## 3. Project Structure
```
src/
├── components/         # Reusable UI components
│   ├── Layout/         # MainLayout, Sidebar
│   └── ProtectedRoute  # Route guard for auth
├── context/            # Global state management
│   ├── AuthContext     # User authentication session
│   └── DatabaseContext # Real-time company/product data
├── pages/              # Application views
│   ├── Assets/         # Asset management (List, Add, Edit, Details)
│   ├── Transfers/      # Asset transfer logic
│   ├── Dashboard       # Analytics and stats
│   ├── Login           # User sign-in
│   ├── Reports         # Data export and filtering
│   ├── Users           # User management
│   └── CompanyMaster   # Master data for companies
└── services/           # Backend integration
    ├── firebase.js     # Firebase configuration
    └── db.js           # Database CRUD operations
```

## 4. Core Services (`src/services/`)

### `firebase.js`
-   Initializes the Firebase application using environment variables (`VITE_FIREBASE_*`).
-   Exports `auth` and `db` instances for use throughout the app.

### `db.js`
-   Contains all direct Firestore interactions.
-   **Key Functions**:
    -   `getAssets()`, `getAssetById(id)`: Fetch asset data.
    -   `addAsset(data)`, `updateAsset(id, data)`: Modify asset records.
    -   `addTransfer(data)`: Log asset movement.
    -   `getAssetHistory(id)`: Retrieve transfer history for an asset.
    -   `getUsers()`, `addUser(data)`: Manage application users.

## 5. Context Providers (`src/context/`)

### `AuthContext.jsx`
-   **Purpose**: Manages the authenticated user's state.
-   **Features**:
    -   Provides `currentUser` object.
    -   Exposes `login(email, password)` and `logout()` functions.
    -   Persists session state across reloads.

### `DatabaseContext.jsx`
-   **Purpose**: Provides real-time access to frequently used master data.
-   **Features**:
    -   Listens to `companies` collection changes in real-time.
    -   Exposes `companies` array to dropdowns (Add Asset, Transfer, etc.).
    -   Provides CRUD methods for Company Master (`addCompany`, `updateCompany`, `deleteCompany`).

## 6. Key Components & Functionality

### `App.jsx`
-   Sets up the `Router`.
-   Wraps the app in `AuthProvider` and `DatabaseContext`.
-   Initializes `ToastContainer` for global notifications.
-   Defines all routes, protecting private routes with `ProtectedRoute`.

### `Dashboard.jsx`
-   Displays key metrics: Total Assets, Assigned, Available, In Repair.
-   Visualizes data using **Recharts**:
    -   Pie Chart: Status Distribution.
    -   Bar Chart: Assets by Company.
    -   Area Chart: Asset Growth over time.
-   Shows a list of recent activities.

### `AssetList.jsx`
-   Main inventory view.
-   **Features**:
    -   Search by Product, Tag No, or Company.
    -   Filter assets.
    -   Actions: View Details, Edit, Delete.
    -   Import Assets from Excel.

### `AddAsset.jsx` / `EditAsset.jsx`
-   Forms for creating and modifying assets.
-   **Key Logic**:
    -   Auto-calculates "Year of Acquisition" from date.
    -   Dynamic "Company" dropdown fetches from Master.
    -   Auto-populates Branch/Location based on selected Company.

### `TransferAsset.jsx`
-   Handles moving an asset from one location/user to another.
-   **Workflow**:
    1.  Select Asset.
    2.  System auto-fills "From" details.
    3.  User selects "To Company" (fetches branches/locations).
    4.  User enters Assignee and Employee ID.
    5.  On Submit: Creates a `transfer` record AND updates the `asset` document.

### `Reports.jsx`
-   Advanced reporting module.
-   **Features**:
    -   **Filtering**: By Company, Status, and Date Range.
    -   **Export**: Generates a detailed `.xlsx` file using `xlsx` library.
    -   Includes all asset fields in the export.

### `CompanyMaster.jsx`
-   CRUD interface for managing Companies, Branches, and Locations.
-   Data entered here populates dropdowns in Asset and Transfer forms.

## 7. Configuration
-   **Environment Variables**: stored in `.env.local`
    -   `VITE_FIREBASE_API_KEY`
    -   `VITE_FIREBASE_AUTH_DOMAIN`
    -   `VITE_FIREBASE_PROJECT_ID`
