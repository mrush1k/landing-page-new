"use client"
// Loader component used on landing while heavy resources load.
export default function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <svg width="48" height="48" viewBox="0 0 50 50" className="animate-spin text-blue-600">
        <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="4" fill="none" strokeOpacity="0.15" />
        <path d="M45 25a20 20 0 0 0-20-20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  )
}
