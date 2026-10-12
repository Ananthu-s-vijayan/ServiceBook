import { useState } from 'react'
import logo from '../../assets/servicebook-logo.svg'
import './Register.css'
import { Link, useNavigate } from 'react-router-dom'

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
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

              <div className="input-wrapper">
                <span className="input-icon">🔒</span>

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="input-wrapper">
                <span className="input-icon">🔒</span>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
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