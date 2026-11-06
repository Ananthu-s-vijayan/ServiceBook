import { useState } from 'react'
import logo from '../../assets/servicebook-logo.svg'
import './Register.css'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword]=useState(false);
  const [showConfirmPassword, setShowConfirmPassword]= useState(false);
  
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    // Frontend validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('Please fill in all fields.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(
        'http://localhost:3000/api/user/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Registration failed.')
        return
      }

      setSuccess('Registration successful! Please check your email for the verification OTP.')

      console.log('Registration successful:', result)

      // Keep the registered email available for the verification page.
      navigate('/verify-email', {
      state: { email: result.data?.email || formData.email },
})
    } catch (error) {
      console.error('Registration request failed:', error)

      setError('Unable to connect to the server.')
    } finally {
      setIsLoading(false)
    }
  }

  
  // Authenticates a user with Google through the ServiceBook backend.
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')
    setSuccess('')

    // Read the Google ID token returned by the Google login component.
    const idToken = credentialResponse.credential

    if (!idToken) {
      setError('Google authentication failed. Please try again.')
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(
        'http://localhost:3000/api/user/google',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            idToken,
            mode: "signup",
           }),
        }
      )

      // Read the response safely so an HTML error page doesn't cause a JSON parsing error.
const responseText = await response.text()

let result

try {
  result = JSON.parse(responseText)
} catch {
  console.error(
    'Google authentication returned a non-JSON response:',
    responseText
  )

  setError('The server returned an unexpected response. Please try again.')
  return
}

if (!response.ok) {
  setError(result.message || 'Google signup failed.')
  return
}

      const token = result.data?.token

      if (!token) {
        setError('No authentication token was returned.')
        return
      }

      // Store the ServiceBook JWT, following the existing login convention.
      localStorage.setItem('token', token)

      // Google has verified the email, so the OTP page is unnecessary.
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Google signup request failed:', error)
      setError('Unable to connect to the server.')
    } finally {
      setIsLoading(false)
    }
  }

  // Display an error if the Google sign-in process fails.
  const handleGoogleError = () => {
    setError('Google sign-in was unsuccessful. Please try again.')
  }



  return (
    <div className="register-page">
      <header className="register-header">
        <Link to="/register" className="header-brand">
          <img
            src={logo}
            alt="ServiceBook"
            className="brand-logo"
          />

          <span className="brand-name">ServiceBook</span>
        </Link>
      </header>

      <main className="register-main">
        <section className="register-card">
          <img
            src={logo}
            alt="ServiceBook"
            className="card-brand-logo"
          />

          <h1>Create Your Account</h1>

          <p className="register-subtitle">
            Join us to get started
          </p>

          <form
            onSubmit={handleSubmit}
            className="register-form"
          >
            <div className="form-group">
              <label htmlFor="fullName">
                Full Name
              </label>

              <div className="input-wrapper">
                <span className="input-icon">👤</span>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>

              <div className="input-wrapper">
                <span className="input-icon">✉</span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

<div className="form-group">
  <label htmlFor="password">
    Password
  </label>

  <div className="input-wrapper register-password-wrapper">
    <span className="input-icon">🔒</span>

    <input
      id="password"
      name="password"
      type={showPassword ? "text" : "password"}
      placeholder="Create a password"
      value={formData.password}
      onChange={handleChange}
      autoComplete="new-password"
    />

    <button
      type="button"
      className="admin-login-password-toggle"
      onClick={() => setShowPassword((previous) => !previous)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      aria-pressed={showPassword}
    >
      {showPassword ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 002.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.2-2.3 3.3" />
          <path d="M6.2 6.2C3.9 7.7 2.5 10 2 12c1 2.5 4.5 7 10 7 1.3 0 2.5-.3 3.6-.8" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  </div>
</div>

<div className="form-group">
  <label htmlFor="confirmPassword">
    Confirm Password
  </label>

  <div className="input-wrapper register-password-wrapper">
    <span className="input-icon">🔒</span>

    <input
      id="confirmPassword"
      name="confirmPassword"
      type={showConfirmPassword ? "text" : "password"}
      placeholder="Confirm your password"
      value={formData.confirmPassword}
      onChange={handleChange}
      autoComplete="new-password"
    />

    <button
      type="button"
      className="admin-login-password-toggle"
      onClick={() =>
        setShowConfirmPassword((previous) => !previous)
      }
      aria-label={
        showConfirmPassword
          ? "Hide confirm password"
          : "Show confirm password"
      }
      aria-pressed={showConfirmPassword}
    >
      {showConfirmPassword ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 002.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.2-2.3 3.3" />
          <path d="M6.2 6.2C3.9 7.7 2.5 10 2 12c1 2.5 4.5 7 10 7 1.3 0 2.5-.3 3.6-.8" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  </div>
</div>

            {error && (
              <p className="register-error">
                {error}
              </p>
            )}

            {success && (
              <p className="register-success">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="register-button"
              disabled={isLoading}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </form>

          
          <div className="google-login-section">
            <div className="google-divider">
              <span>OR</span>
            </div>

            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
            />
          </div>



          <p className="login-text">
            Already have an account?{' '}
            <Link to="/login">
              Login
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}

export default Register