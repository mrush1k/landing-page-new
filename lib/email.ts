import nodemailer from 'nodemailer'

// Create a singleton transporter with pooling enabled to reduce SMTP handshake overhead
let transporter: nodemailer.Transporter | null = null

export function getTransporter() {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true, // use pooled connections
    maxMessages: 100,
    maxConnections: 5,
    greetingTimeout: 3000,
  })

  // Optionally verify connection on first creation (non-blocking)
  transporter.verify().then(() => {
    console.log('SMTP transporter verified')
  }).catch((err) => {
    console.warn('SMTP transporter verification failed:', err && err.message)
  })

  return transporter
}

export default getTransporter
