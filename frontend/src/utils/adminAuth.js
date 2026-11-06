// Handle expired or invalid admin authentication.
export const handleAdminAuthError = (status) => {
    if (status !== 401) {
        return false;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.replace("/admin/login");

    return true;
};