import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import logo from "../../assets/servicebook-logo.svg";
import "./ForgotPassword.css";

const API_URL = "http://localhost:3000/api/user";

function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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

        try {
            setIsLoading(true);

            const response = await axios.post(
                `${API_URL}/forgot-password`,
                { email: normalizedEmail }
            );

            if (response.data?.success) {
                navigate("/reset-password", {
                    state: {
                        email: normalizedEmail,
                        message: response.data.message,
                    },
                    replace: true,
               });
            } else {
                setError(
                    response.data?.message ||
                    "Unable to process your request. Please try again."
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to process your request. Please try again later."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="forgot-password-page">
            <header className="forgot-password-header">
                <Link
                    to="/"
                    className="forgot-password-brand"
                    aria-label="ServiceBook home"
                >
                    <img
                        src={logo}
                        alt="ServiceBook logo"
                        className="forgot-password-brand-logo"
                    />

                    <span className="forgot-password-brand-name">
                        ServiceBook
                    </span>
                </Link>
            </header>

            <main className="forgot-password-main">
                <section
                    className="forgot-password-card"
                    aria-labelledby="forgot-password-title"
                >
                    <img
                        src={logo}
                        alt=""
                        className="forgot-password-card-logo"
                    />

                    <h1 id="forgot-password-title">
                        Forgot Password?
                    </h1>

                    <p className="forgot-password-subtitle">
                        Enter the email address associated with your
                        ServiceBook account. If eligible, you will receive
                        an OTP to reset your password.
                    </p>

                    <form
                        className="forgot-password-form"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        <div className="forgot-password-form-group">
                            <label htmlFor="forgot-password-email">
                                Email Address
                            </label>

                            <input
                                id="forgot-password-email"
                                type="email"
                                name="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    setError("");
                                    setSuccess("");
                                }}
                                autoComplete="email"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <p
                                className="forgot-password-error"
                                role="alert"
                            >
                                {error}
                            </p>
                        )}

                        {success && (
                            <p
                                className="forgot-password-success"
                                role="status"
                            >
                                {success}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="forgot-password-button"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? "Sending request..."
                                : "Continue"}
                        </button>
                    </form>

                    <p className="forgot-password-back">
                        Remember your password?{" "}
                        <Link to="/login">
                            Back to Login
                        </Link>
                    </p>
                </section>
            </main>
        </div>
    );
}

export default ForgotPassword;