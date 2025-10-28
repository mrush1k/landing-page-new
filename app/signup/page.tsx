"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { COUNTRIES } from '@/lib/types'
import { detectUserCountry, getSettingsForCountry } from '@/lib/country-utils'
import { Eye, EyeOff, Building, Zap, Shield, BarChart, CheckCircle, Users, DollarSign } from 'lucide-react'
import { SocialLoginButtons } from '@/components/social-login-buttons'
import DynamicBackground from '@/components/landing/DynamicBackground'
import { useWorkflowDiagnostics, useFormDiagnostics } from '@/components/diagnostic-provider'

const WORK_TYPE_OPTIONS = [
  { value: 'trades-construction', label: 'Trades & Construction – Builders, electricians, plumbers, painters, etc.' },
  { value: 'creative-digital', label: 'Creative & Digital – Designers, developers, photographers, writers, etc.' },
  { value: 'freelance-consulting', label: 'Freelance & Consulting – Solo operators, consultants, advisors, etc.' },
  { value: 'landscaping-outdoor', label: 'Landscaping & Outdoor Work – Gardeners, landscapers, fencing, etc.' },
  { value: 'retail-sales', label: 'Retail & Sales Services – Sales, personal services, delivery, etc.' },
  { value: 'solo-small-business', label: 'Solo Operator / Small Business – General category for small business owners.' },
  { value: 'other', label: 'Other / Not Listed' },
]

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    country: '',
    currency: '',
    workType: '',
    customWorkType: '',
    companyName: '',
    businessRegNumber: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    dateFormat: 'DD/MM/YYYY',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signUp } = useAuth()
  const router = useRouter()
  
  // Diagnostic hooks
  const workflowDiagnostics = useWorkflowDiagnostics('user-signup')
  const formDiagnostics = useFormDiagnostics('signup-form')

  // Auto-detect country on component mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const detectedCountry = await detectUserCountry()
        if (detectedCountry && !formData.country) {
          const settings = getSettingsForCountry(detectedCountry)
          setFormData(prev => ({
            ...prev,
            country: settings.country,
            currency: settings.currency,
            dateFormat: settings.dateFormat
          }))
        }
      } catch (error) {
        console.log('Country detection failed, using defaults')
      }
    }
    
    detectCountry()
  }, [])

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode)
    setFormData({
      ...formData,
      country: countryCode,
      currency: country?.currency || '',
    })
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file)
    }
  }

  const getBusinessRegLabel = () => {
    const country = COUNTRIES.find(c => c.code === formData.country)
    return country?.businessRegLabel || 'Business Registration Number'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Run workflow diagnostics before submission
    await workflowDiagnostics.triggerDiagnostics()

    // Validate form fields with diagnostics
    const requiredFields = [
      { name: 'email', value: formData.email, rules: [{ required: true }, { pattern: /\S+@\S+\.\S+/, message: 'Invalid email format' }] },
      { name: 'username', value: formData.username, rules: [{ required: true }] },
      { name: 'password', value: formData.password, rules: [{ required: true }] },
      { name: 'country', value: formData.country, rules: [{ required: true }] },
      { name: 'currency', value: formData.currency, rules: [{ required: true }] }
    ]

    let hasValidationErrors = false
    for (const field of requiredFields) {
      const errors = formDiagnostics.validateField(field.name, field.value, field.rules)
      if (errors.length > 0) {
        hasValidationErrors = true
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      formDiagnostics.validateField('confirmPassword', formData.confirmPassword, [])
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      formDiagnostics.validateField('password', formData.password, [])
      return
    }

    if (hasValidationErrors) {
      setError('Please fix the validation errors above')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(formData.email, formData.password, {
        username: formData.username,
        country: formData.country,
        currency: formData.currency,
        workType: formData.workType === 'other' ? formData.customWorkType : formData.workType,
        businessName: formData.companyName,
        businessRegNumber: formData.businessRegNumber,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.postalCode,
      })

      if (error) {
        let errorMessage = error.message || 'Failed to create account'
        
        // Provide helpful error messages for common issues
        if (errorMessage.includes('email_address_invalid')) {
          errorMessage = 'Please use a real email address (test emails are not allowed)'
        } else if (errorMessage.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Try logging in instead.'
        } else if (errorMessage.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long'
        }
        
        setError(errorMessage)
        formDiagnostics.reportFormSubmission(false, { error: error.message })
        setLoading(false)
      } else {
        formDiagnostics.reportFormSubmission(true, { username: formData.username })
        router.push('/dashboard')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      formDiagnostics.reportFormSubmission(false, { error: errorMessage })
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
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
                Start Your
              </span>
              <br />
              <span className="gradient-text-secondary">
                Invoicing Journey
              </span>
            </h1>
            
            <p className="brand-description">
              Join thousands of professionals who trust Invoice Easy for their business invoicing needs. 
              Get started in minutes with our AI-powered platform.
            </p>

            {/* Feature highlights */}
            <div className="signup-features">
              <div className="feature-highlight">
                <div className="feature-highlight-icon">
                  <Zap size={20} />
                </div>
                <h3 className="feature-highlight-title">Quick Setup</h3>
                <p className="feature-highlight-description">
                  Get your invoicing system ready in under 5 minutes
                </p>
              </div>

              <div className="feature-highlight">
                <div className="feature-highlight-icon">
                  <Shield size={20} />
                </div>
                <h3 className="feature-highlight-title">Secure & Reliable</h3>
                <p className="feature-highlight-description">
                  Bank-grade security with 99.9% uptime guarantee
                </p>
              </div>

              <div className="feature-highlight">
                <div className="feature-highlight-icon">
                  <BarChart size={20} />
                </div>
                <h3 className="feature-highlight-title">Smart Analytics</h3>
                <p className="feature-highlight-description">
                  Track payments and business insights automatically
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Signup form */}
          <div className="auth-card">
            <div className="auth-card-content">
              {/* Header */}
              <div className="auth-header">
                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Set up your professional invoicing account</p>
              </div>

              {/* Social Login */}
              <div>
                <SocialLoginButtons 
                  isSignUp={true}
                  disabled={loading}
                />
                
                <div className="social-separator">
                  <span className="social-separator-text">Or continue with email</span>
                </div>
              </div>

              {/* Signup form */}
              <form onSubmit={handleSubmit} className="auth-form">
                {/* Email and Username */}
                <div className="signup-grid">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email Address</label>
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
                    <label htmlFor="username" className="form-label">Username</label>
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      placeholder="Choose a username"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Password fields */}
                <div className="signup-grid">
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
                  
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <div className="password-container">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        placeholder="Confirm your password"
                        className="form-input password-input"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Company Logo */}
                <div className="signup-section">
                  <label className="section-title">Company Logo (Optional)</label>
                  <div className="logo-upload-container">
                    <div className="logo-preview">
                      {logoFile ? (
                        <img 
                          src={URL.createObjectURL(logoFile)} 
                          alt="Logo preview"
                        />
                      ) : (
                        <Building />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        id="logo"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="file-input"
                      />
                      <label htmlFor="logo" className="file-label">
                        Upload Logo
                      </label>
                    </div>
                  </div>
                </div>

                {/* Company Name */}
                <div className="form-group">
                  <label htmlFor="companyName" className="form-label">Company Name</label>
                  <input
                    id="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g., Jane's Plumbing"
                    className="form-input"
                  />
                </div>

                {/* Country */}
                <div className="form-group">
                  <label htmlFor="country" className="form-label">Country of Business</label>
                  <select 
                    value={formData.country} 
                    onChange={(e) => handleCountryChange(e.target.value)} 
                    required
                    className="form-select"
                  >
                    <option value="">Select your country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Business Registration Number */}
                {formData.country && (
                  <div className="form-group">
                    <label htmlFor="businessRegNumber" className="form-label">
                      {getBusinessRegLabel()}
                    </label>
                    <input
                      id="businessRegNumber"
                      type="text"
                      value={formData.businessRegNumber}
                      onChange={(e) => setFormData({ ...formData, businessRegNumber: e.target.value })}
                      placeholder={formData.country === 'AU' ? '11 digit ABN' : 'Business registration number'}
                      className="form-input"
                    />
                  </div>
                )}

                {/* Business Address */}
                <div className="signup-section">
                  <label className="section-title">Business Address (Optional)</label>
                  <div className="address-grid">
                    <input
                      placeholder="Street Address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="form-input"
                    />
                    
                    <input
                      placeholder="Suburb"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="form-input"
                    />
                    
                    <div className="address-grid-row">
                      <input
                        placeholder="State"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="form-input"
                      />
                      <input
                        placeholder="Postcode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Work Type */}
                <div className="form-group">
                  <label className="form-label">Tell Us What You Do</label>
                  <select 
                    value={formData.workType} 
                    onChange={(e) => setFormData({ ...formData, workType: e.target.value })} 
                    required
                    className="form-select"
                  >
                    <option value="">Select your line of work...</option>
                    {WORK_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.workType === 'other' && (
                  <div className="form-group">
                    <input
                      type="text"
                      value={formData.customWorkType}
                      onChange={(e) => setFormData({ ...formData, customWorkType: e.target.value })}
                      required
                      placeholder="Enter your work type"
                      className="form-input"
                    />
                  </div>
                )}

                {/* Date Format */}
                <div className="form-group">
                  <label className="form-label">Date Format</label>
                  <select 
                    value={formData.dateFormat} 
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                    className="form-select"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
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
                      Setting up...
                    </>
                  ) : (
                    <>
                      Create Account
                      <CheckCircle size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Footer links */}
              <div className="auth-footer">
                <div className="auth-footer-text">
                  Already have an account?{' '}
                  <Link 
                    href="/login" 
                    className="auth-link"
                  >
                    Sign in
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