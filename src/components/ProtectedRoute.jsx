import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
        // Redirect to dashboard if user doesn't have permission
        // Or show a "Not Authorized" message
        return <Navigate to="/" />;
    }

    return children;
}
