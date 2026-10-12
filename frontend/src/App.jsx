import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import Home from "./pages/customer/Home";
import Services from "./pages/customer/Services";
import ServiceDetails from "./pages/customer/ServiceDetails";

import ServiceManagement from "./pages/admin/ServiceManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";

import AdminLayout from "./components/admin/AdminLayout";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Customer/Auth routes */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/verify-email"
                    element={<VerifyEmail />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />

                {/* Customer routes */}

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/services"
                    element={<Services />}
                />

                <Route
                    path="/services/:id"
                    element={<ServiceDetails />}
                />

                {/* Admin routes */}

                <Route
                    path="/admin"
                    element={<AdminLayout />}
                >
                    <Route
                        path="services"
                        element={<ServiceManagement />}
                    />

                    <Route
                        path="categories"
                        element={<CategoryManagement />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;