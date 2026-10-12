import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/servicebook-logo.svg'
import './Login.css'

function Login() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

      // Navigate to the landing page after successful login
      navigate('/', { replace: true })

    } catch (error) {
      console.error('Login request failed:', error)

      setError('Unable to connect to the server.')
    } finally {
      setIsLoading(false)
    }
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

              <div className="login-input-wrapper">
                <span className="login-input-icon">🔒</span>

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
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