import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import Home from "./pages/customer/Home";
import Services from "./pages/customer/Services";
import ServiceDetails from "./pages/customer/ServiceDetails";
import AddressSelection from "./pages/customer/booking/AddressSelection";
import DateTimeSelection from "./pages/customer/booking/DateTimeSelection";
import BookingConfirmation from "./pages/customer/booking/BookingConfirmation";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";

import ServiceManagement from "./pages/admin/ServiceManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import AvailabilityManagement from "./pages/admin/AvailabilityManagement";

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

                <Route
                    path="/services/:id/book/address"
                    element={<AddressSelection/>}
                />

                <Route
                    path="/services/:id/book/slot"
                    element={<DateTimeSelection/>}
                />

                <Route
                    path="/services/:id/book/confirm"
                    element={<BookingConfirmation/>}
                />    

                {/* Admin routes */}

                <Route
                    path="/admin/login"
                    element={<AdminLogin/>}
                />

                {/* Protected admin routes */}
                <Route element={<AdminProtectedRoute/>}>
                <Route
                    path="/admin"
                    element={<AdminLayout />}
                >

                    <Route
                        path="dashboard"
                        element={<Dashboard/>}
                    />

                    <Route
                        path="services"
                        element={<ServiceManagement />}
                    />

                    <Route
                        path="categories"
                        element={<CategoryManagement />}
                    />

                    <Route
                        path="availability"
                        element={<AvailabilityManagement/>}
                    />
                    
                </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;