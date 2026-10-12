import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import logo from "../../assets/servicebook-logo.svg";
import "./ResetPassword.css";

const API_URL = "http://localhost:3000/api/user";

function ResetPassword() {
    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState(location.state?.email || "");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Validate the new password using the rules enforced by the backend.
    const validatePassword = (password) => {
        if (password.length < 8) {
            return "Password must contain at least 8 characters.";
        }

        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter.";
        }

        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter.";
        }

        if (!/[0-9]/.test(password)) {
            return "Password must contain at least one number.";
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            return "Password must contain at least one special character.";
        }

        return "";
    };

    const handleOtpChange = (event) => {
        // Accept only digits and limit the OTP to six characters.
        const digitsOnly = event.target.value
            .replace(/\D/g, "")
            .slice(0, 6);

        setOtp(digitsOnly);
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError("Please enter your email address.");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!/^\d{6}$/.test(otp)) {
            setError("Please enter the complete six-digit OTP.");
            return;
        }

        const passwordError = validatePassword(newPassword);

        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("The passwords do not match.");
            return;
        }

        try {
            setIsLoading(true);

            const response = await axios.post(
                `${API_URL}/reset-password`,
                {
                    email: normalizedEmail,
                    otp,
                    newPassword,
                }
            );

            if (response.data?.success) {
                setSuccess(
                    response.data.message ||
                    "Your password has been reset successfully."
                );

                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setError(
                    response.data?.message ||
                    "Unable to reset your password. Please try again."
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to reset your password. Please try again later."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestAnotherOtp = () => {
        navigate("/forgot-password", {
            state: { email: email.trim().toLowerCase() },
        });
    };

    return (
        <div className="reset-password-page">
            <header className="reset-password-header">
                <Link
                    to="/"
                    className="reset-password-brand"
                    aria-label="ServiceBook home"
                >
                    <img
                        src={logo}
                        alt="ServiceBook logo"
                        className="reset-password-brand-logo"
                    />

                    <span className="reset-password-brand-name">
                        ServiceBook
                    </span>
                </Link>
            </header>

            <main className="reset-password-main">
                <section
                    className="reset-password-card"
                    aria-labelledby="reset-password-title"
                >
                    <img
                        src={logo}
                        alt=""
                        className="reset-password-card-logo"
                    />

                    <h1 id="reset-password-title">
                        Reset Your Password
                    </h1>

                    <p className="reset-password-subtitle">
                        Enter the OTP sent to your email and choose a
                        new password for your ServiceBook account.
                    </p>

                    {location.state?.message && (
                        <p className="reset-password-info" role="status">
                            {location.state.message}
                        </p>
                    )}

                    {success ? (
                        <div className="reset-password-complete">
                            <p
                                className="reset-password-success"
                                role="status"
                            >
                                {success}
                            </p>

                            <Link
                                to="/login"
                                state={{ email: email.trim().toLowerCase() }}
                                className="reset-password-button reset-password-login-button"
                            >
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form
                            className="reset-password-form"
                            onSubmit={handleSubmit}
                            noValidate
                        >
                            <div className="reset-password-form-group">
                                <label htmlFor="reset-email">
                                    Email Address
                                </label>

                                <input
                                    id="reset-email"
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setError("");
                                    }}
                                    autoComplete="email"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="reset-password-form-group">
                                <label htmlFor="reset-otp">
                                    Six-Digit OTP
                                </label>

                                <input
                                    id="reset-otp"
                                    type="text"
                                    name="otp"
                                    placeholder="Enter the OTP"
                                    value={otp}
                                    onChange={handleOtpChange}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    required
                                    disabled={isLoading}
                                    className="reset-password-otp-input"
                                />

                                <small className="reset-password-hint">
                                    Enter the six-digit code sent to your email.
                                </small>
                            </div>

                            <div className="reset-password-form-group">
                                <label htmlFor="new-password">
                                    New Password
                                </label>

                                <input
                                    id="new-password"
                                    type="password"
                                    name="newPassword"
                                    placeholder="Enter your new password"
                                    value={newPassword}
                                    onChange={(event) => {
                                        setNewPassword(event.target.value);
                                        setError("");
                                    }}
                                    autoComplete="new-password"
                                    required
                                    disabled={isLoading}
                                />

                                <small className="reset-password-hint">
                                    At least 8 characters, including uppercase,
                                    lowercase, a number, and a special character.
                                </small>
                            </div>

                            <div className="reset-password-form-group">
                                <label htmlFor="confirm-password">
                                    Confirm New Password
                                </label>

                                <input
                                    id="confirm-password"
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Re-enter your new password"
                                    value={confirmPassword}
                                    onChange={(event) => {
                                        setConfirmPassword(event.target.value);
                                        setError("");
                                    }}
                                    autoComplete="new-password"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {error && (
                                <p
                                    className="reset-password-error"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="reset-password-button"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? "Resetting password..."
                                    : "Reset Password"}
                            </button>
                        </form>
                    )}

                    {!success && (
                        <div className="reset-password-footer">
                            <button
                                type="button"
                                className="reset-password-resend"
                                onClick={handleRequestAnotherOtp}
                                disabled={isLoading}
                            >
                                Request another OTP
                            </button>

                            <p>
                                Remember your password?{" "}
                                <Link to="/login">Back to Login</Link>
                            </p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default ResetPassword;