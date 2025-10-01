"use client"
import { useState } from 'react'

export default function FooterLanding() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      // Reuse existing SMTP-connected API route (app/api/email/send or similar)
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      })
      setStatus('sent')
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="4" width="18" height="16" rx="2" fill="#2563EB" />
                <path d="M7 9h10M7 13h6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold">Invoice Easy</h4>
          </div>
          <p className="text-sm">Simple invoice management for solo operators and small businesses.</p>
        </div>

        <div>
          <h5 className="font-semibold mb-2">Links</h5>
          <ul className="space-y-2 text-sm">
            <li><a href="#features" className="hover:underline">Features</a></li>
            <li><a href="#pricing" className="hover:underline">Pricing</a></li>
            <li><a href="#contact" className="hover:underline">Contact</a></li>
            <li><a href="#faq" className="hover:underline">FAQ</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-semibold mb-2">Contact Us</h5>
          <form onSubmit={submit} className="space-y-2" aria-label="Inquiry form">
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full p-2 rounded-md border" />
            <input required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full p-2 rounded-md border" />
            <textarea required value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" className="w-full p-2 rounded-md border" />
            <div>
              <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending...' : 'Send Inquiry'}
              </button>
              {status === 'sent' && <span className="ml-3 text-sm text-green-600">Sent. Thank you!</span>}
              {status === 'error' && <span className="ml-3 text-sm text-red-600">Error sending. Try again.</span>}
            </div>
          </form>
        </div>
      </div>
      <div className="mt-8 text-center text-sm text-gray-500">© {new Date().getFullYear()} Invoice Easy</div>
    </footer>
  )
}
