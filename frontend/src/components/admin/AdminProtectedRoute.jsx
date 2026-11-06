import { Navigate, Outlet } from "react-router-dom";

function AdminProtectedRoute() {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    // Test whether authentication data exists.
    if (!token || !storedUser) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return <Navigate to="/admin/login" replace />;
    }

    let user;

    try {
        user = JSON.parse(storedUser);
    } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return <Navigate to="/admin/login" replace />;
    }

    // Only administrators may access admin pages.
    if (user.role !== "admin") {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default AdminProtectedRoute;