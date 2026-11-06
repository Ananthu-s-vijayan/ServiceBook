import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminLogin.css";

function AdminLogin() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!formData.email.trim() || !formData.password) {
            setError("Please enter your email and password.");
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch(
                "http://localhost:3000/api/user/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: formData.email.trim(),
                        password: formData.password,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setError(result.message || "Login failed.");
                return;
            }

            const user = result.data;
            const token = user?.token;

            if (!token) {
                setError("Login succeeded, but no authentication token was received.");
                return;
            }

            // Only administrators may enter the admin portal.
            if (user.role !== "admin") {
                setError("Access denied. An administrator account is required.");
                return;
            }

            // Store the JWT using the same key as the existing login page.
            localStorage.setItem("token", token);

            // Save the authenticated user's details for the admin interface.
            localStorage.setItem(
                "user",
                JSON.stringify({
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                })
            );

            navigate("/admin/dashboard", { replace: true });
        } catch (error) {
            console.error("Admin login request failed:", error);
            setError("Unable to connect to the server. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <header className="admin-login-header">
                <div className="admin-login-brand">
                    <div className="admin-login-logo" aria-hidden="true">
                        ⚒
                    </div>

                    <div className="admin-login-brand-text">
                        <strong>ServiceBook</strong>
                        <span>ADMINISTRATION PORTAL</span>
                    </div>
                </div>
            </header>

            <main className="admin-login-main">
                <section className="admin-login-card">
                    <div className="admin-login-icon" aria-hidden="true">
                        ♙
                    </div>

                    <h1>Admin Portal Login</h1>

                    <p className="admin-login-description">
                        Sign in to manage your services and bookings.
                    </p>

                    <form
                        className="admin-login-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="admin-login-field">
                            <label htmlFor="admin-email">
                                Admin Email
                            </label>

                            <input
                                id="admin-email"
                                className="admin-login-input"
                                type="email"
                                name="email"
                                placeholder="admin@servicebook.com"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="admin-login-field">
                            <label htmlFor="admin-password">
                                Password
                            </label>

                            <div className="admin-login-password-wrapper">
                                <input
                                    id="admin-password"
                                    className="admin-login-input"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="admin-login-password-toggle"
                                    onClick={() =>
                                        setShowPassword((previous) => !previous)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? (
                                        // Eye with a diagonal line when the password is visible.
                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path d="M3 3118 18"/>
                                            <path d="M10.6 10.6a2 2 0 002.8 2.8"/>
                                            <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.2-2.3 3.3"/>
                                            <path d="M6.2 6.2C3.9 7.7 2.5 10 2 12c1 2.5 4.5 7 10 7 1.3 0 2.5-.3 3.6-.8"/>
                                        </svg>
                                        ) : (
                                            //Eye when the password is hidden.
                                            <svg
                                               viewBox="0 0 24 24"
                                               aria-hidden="true"
                                            >
                                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>

                                        )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="admin-login-error" role="alert">
                                {error}
                            </p>
                        )}

                        <button
                            className="admin-login-submit"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign In to Dashboard"}
                        </button>
                    </form>

                    <p className="admin-login-footer">
                        Are you a customer?
                        <br />

                        <Link to="/login">
                            Return to Customer Login
                        </Link>
                    </p>
                </section>
            </main>
        </div>
    );
}

export default AdminLogin;