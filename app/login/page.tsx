"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff, ArrowRight, FileText, DollarSign, Users, Zap, Shield, CheckCircle, PenTool, BarChart } from 'lucide-react'
import { SocialLoginButtons } from '@/components/social-login-buttons'
import DynamicBackground from '@/components/landing/DynamicBackground'
// Uncomment the line below to enable Google One Tap
// import OneTapComponent from '@/components/google-one-tap'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(formData.email, formData.password)

    if (error) {
      setError(error.message || 'Failed to sign in')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="auth-page">
      {/* Uncomment the line below to enable Google One Tap */}
      {/* <OneTapComponent /> */}
      
      {/* Professional Background */}
      <DynamicBackground />

      {/* Main content */}
      <div className="auth-container">
        <div className="auth-grid">
          
          {/* Left side - Branding and features */}
          <div className="auth-branding">
            {/* Logo and heading */}
            <div className="brand-logo">
              <div className="brand-icon">
                IE
              </div>
              <span className="brand-name">Invoice Easy</span>
            </div>

            <h1 className="brand-heading">
              <span className="gradient-text-primary">
                Welcome Back to
              </span>
              <br />
              <span className="gradient-text-secondary">
                Your Invoice Hub
              </span>
            </h1>
            
            <p className="brand-description">
              Continue managing your invoices with professional AI-powered tools. 
              Generate, track, and get paid faster than ever.
            </p>

            {/* Features list */}
            <div className="feature-list">
              {[
                { icon: Zap, text: "Lightning-fast invoice generation" },
                { icon: Shield, text: "Bank-grade security & encryption" },
                { icon: Users, text: "Team collaboration tools" },
                { icon: DollarSign, text: "Real-time payment tracking" },
                { icon: CheckCircle, text: "Automated payment reminders" },
                { icon: PenTool, text: "Professional invoice templates" },
                { icon: BarChart, text: "Advanced analytics dashboard" }
              ].map((feature, index) => (
                <div key={index} className="feature-item">
                  <div className="feature-icon">
                    <feature.icon />
                  </div>
                  <span className="feature-text">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="auth-card">
            <div className="auth-card-content">
              {/* Header */}
              <div className="auth-header">
                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-subtitle">Sign in to your invoice account</p>
              </div>

              {/* Social Login */}
              <div>
                <SocialLoginButtons disabled={loading} />
                
                <div className="social-separator">
                  <span className="social-separator-text">Or continue with email</span>
                </div>
              </div>

              {/* Login form */}
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="Enter your email"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="password-container">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      placeholder="Enter your password"
                      className="form-input password-input"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Footer links */}
              <div className="auth-footer">
                <Link 
                  href="/reset-password" 
                  className="auth-link"
                >
                  Forgot your password?
                </Link>

                <div className="auth-footer-text">
                  Don't have an account?{' '}
                  <Link 
                    href="/signup" 
                    className="auth-link"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}