import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/servicebook-logo.svg'
import './VerifyEmail.css'

function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()

  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const handleVerify = async (event) => {
    event.preventDefault()

    setError('')
    setMessage('')

    if (!email.trim() || !otp.trim()) {
      setError('Please enter your email and verification OTP.')
      return
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Please enter the complete 6-digit OTP.')
      return
    }

    try {
      setIsVerifying(true)

      const response = await fetch(
        'http://localhost:3000/api/user/verify-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            otp: otp.trim(),
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Email verification failed.')
        return
      }

      setMessage(
        'Email verified successfully! Redirecting to login...'
      )

      setTimeout(() => {
        navigate('/login', {
          state: {
            email: email.trim(),
          },
        })
      }, 1500)
    } catch (error) {
      console.error('Email verification request failed:', error)
      setError('Unable to connect to the server.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Please enter your registered email address.')
      return
    }

    try {
      setIsResending(true)

      const response = await fetch(
        'http://localhost:3000/api/user/resend-verification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Unable to resend the OTP.')
        return
      }

      setMessage(
        result.message ||
          'If eligible, a new verification OTP will be sent.'
      )

      setCooldown(result.data?.resendCooldownSeconds ?? 60)
    } catch (error) {
      console.error('Resend verification request failed:', error)
      setError('Unable to connect to the server.')
    } finally {
      setIsResending(false)
    }
  }

  // Purpose: count down the resend cooldown so users cannot repeatedly request OTPs.
  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setInterval(() => {
      setCooldown((previous) => Math.max(0, previous - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  return (
    <div className="verify-email-page">
      <header className="verify-email-header">
        <Link
          to="/login"
          className="verify-email-header-brand"
        >
          <img
            src={logo}
            alt="ServiceBook"
            className="verify-email-brand-logo"
          />

          <span className="verify-email-brand-name">
            ServiceBook
          </span>
        </Link>
      </header>

      <main className="verify-email-main">
        <section className="verify-email-card">
          <img
            src={logo}
            alt="ServiceBook"
            className="verify-email-card-logo"
          />

          <h1>Verify Your Email</h1>

          <p className="verify-email-subtitle">
            Enter the 6-digit verification code sent to your email
            address to activate your ServiceBook account.
          </p>

          <form
            onSubmit={handleVerify}
            className="verify-email-form"
          >
            <div className="verify-email-form-group">
              <label htmlFor="verification-email">
                Email address
              </label>

              <div className="verify-email-input-wrapper">
                <span
                  className="verify-email-input-icon"
                  aria-hidden="true"
                >
                  ✉
                </span>

                <input
                  id="verification-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError('')
                    setMessage('')
                  }}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="verify-email-form-group">
              <label htmlFor="verification-otp">
                Verification code
              </label>

              <div className="verify-email-input-wrapper">
                <span
                  className="verify-email-input-icon"
                  aria-hidden="true"
                >
                  #
                </span>

                <input
                  id="verification-otp"
                  className="otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => {
                    setOtp(
                      event.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6)
                    )
                    setError('')
                    setMessage('')
                  }}
                  placeholder="000000"
                  aria-describedby={
                    error ? 'verification-error' : undefined
                  }
                  required
                />
              </div>
            </div>

            {error && (
              <p
                id="verification-error"
                className="verify-email-error"
                role="alert"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                className="verify-email-success"
                role="status"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              className="verify-email-button"
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="verify-email-resend">
            <p className="verify-email-resend-text">
              Didn't receive the code?
            </p>

            <button
              type="button"
              className="verify-email-resend-button"
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
            >
              {isResending
                ? 'Sending...'
                : cooldown > 0
                  ? `Resend OTP in ${cooldown}s`
                  : 'Resend verification code'}
            </button>
          </div>

          <p className="verify-email-login-text">
            Already verified? <Link to="/login">Log in</Link>
          </p>
        </section>
      </main>
    </div>
  )
}

export default VerifyEmail