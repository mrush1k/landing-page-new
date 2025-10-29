import { useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook to prevent duplicate fetch calls in React Strict Mode
 * This hook ensures the fetch function is only called once on mount,
 * even when React intentionally double-renders in development mode.
 * 
 * @param fetchFn - The async function to call once on mount
 * @param dependencies - Dependencies array (similar to useEffect)
 * 
 * @example
 * ```tsx
 * const loadData = useCallback(async () => {
 *   const headers = await getAuthHeaders()
 *   const response = await fetch('/api/data', { headers })
 *   const data = await response.json()
 *   setData(data)
 * }, [getAuthHeaders])
 * 
 * useFetchOnce(loadData, [loadData])
 * ```
 */
export function useFetchOnce(
  fetchFn: () => void | Promise<void>,
  dependencies: any[] = []
) {
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchFn()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)
}

/**
 * Reset hook for when you need to re-fetch data (e.g., after mutations)
 * Returns a function to reset the fetch guard
 * 
 * @example
 * ```tsx
 * const [loadData, resetFetch] = useFetchOnceWithReset(async () => {
 *   // fetch logic
 * }, [deps])
 * 
 * // Later, after creating/updating data:
 * resetFetch() // This will allow the next effect run to fetch again
 * ```
 */
export function useFetchOnceWithReset(
  fetchFn: () => void | Promise<void>,
  dependencies: any[] = []
): [() => void, () => void] {
  const hasFetchedRef = useRef(false)

  const reset = useCallback(() => {
    hasFetchedRef.current = false
  }, [])

  const fetch = useCallback(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchFn()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  useEffect(() => {
    fetch()
  }, [fetch])

  return [reset, fetch]
}
