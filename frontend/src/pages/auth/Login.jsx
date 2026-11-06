import { useState } from 'react'
import { Link, useNavigate,useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import logo from '../../assets/servicebook-logo.svg'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [showPassword, setShowPassword]=useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    // Frontend validation
    if (!formData.email.trim() || !formData.password) {
      setError('Please enter your email and password.')
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(
        'http://localhost:3000/api/user/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Login failed.')
        return
      }

      const token = result.data?.token

      if (!token) {
        setError(
          'Login succeeded, but no authentication token was received.'
        )
        return
      }

      // Store JWT for authenticated requests
      localStorage.setItem('token', token)

      const from = location.state?.from

      navigate(
        from
        ? `${from.pathname}${from.search || ""}`
        : "/",
        {replace: true}
      )

    } catch (error) {
      console.error('Login request failed:', error)

      setError('Unable to connect to the server.')
    } finally {
      setIsLoading(false)
    }
  }

  
  // Authenticates an existing ServiceBook user through Google.
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')

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
            mode: "login",
           }),
        }
      )

      // Read the response safely, including non-JSON error responses.
      const responseText = await response.text()
      let result

      try {
        result = JSON.parse(responseText)
      } catch {
        console.error(
          'Google login returned a non-JSON response:',
          responseText
        )
        setError('The server returned an unexpected response.')
        return
      }

      if (!response.ok) {
        setError(result.message || 'Google login failed.')
        return
      }

      const token = result.data?.token

      if (!token) {
        setError('No authentication token was returned.')
        return
      }

      // Use the same JWT storage convention as password login.
      localStorage.setItem('token', token)

      // Preserve the existing protected-route redirect behavior.
      const from = location.state?.from

      navigate(
        from
          ? `${from.pathname}${from.search || ''}`
          : '/',
        { replace: true }
      )
    } catch (error) {
      console.error('Google login request failed:', error)
      setError('Unable to connect to the server.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handles failures in the Google sign-in interface.
  const handleGoogleError = () => {
    setError('Google sign-in was unsuccessful. Please try again.')
  }



  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/login" className="login-header-brand">
          <img
            src={logo}
            alt="ServiceBook"
            className="login-brand-logo"
          />

          <span className="login-brand-name">
            ServiceBook
          </span>
        </Link>
      </header>

      <main className="login-main">
        <section className="login-card">
          <img
            src={logo}
            alt="ServiceBook"
            className="login-card-logo"
          />

          <h1>Welcome Back!</h1>

          <p className="login-subtitle">
            Login to your account to continue
          </p>

          <form
            onSubmit={handleSubmit}
            className="login-form"
          >
            <div className="login-form-group">
              <label htmlFor="email">
                Email
              </label>

              <div className="login-input-wrapper">
                <span className="login-input-icon">✉</span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

<div className="login-form-group">
  <label htmlFor="password">
    Password
  </label>

  <div className="login-input-wrapper login-password-wrapper">
    <span className="login-input-icon">🔒</span>

    <input
      id="password"
      name="password"
      type={showPassword ? "text" : "password"}
      placeholder="Enter your password"
      value={formData.password}
      onChange={handleChange}
      autoComplete="current-password"
      required
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

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  name="rememberMe"
                />

                <span>Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="forgot-password-link"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
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



          <p className="register-text">
            Don't have an account?{' '}
            <Link to="/register">
              Register
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}

export default Login