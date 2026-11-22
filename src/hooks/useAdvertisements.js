import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export function useAdvertisements(enabled = true) {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(Boolean(enabled))
  const [error, setError] = useState(null)
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    if (!isSupabaseConfigured) {
      setError('Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load the dashboard.')
      setLoading(false)
      return
    }
    const currentRequest = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const { data, error: queryError } = await supabase
        .from('advertisement_analysis')
        .select('*')
        .order('created_at', { ascending: false })
      if (currentRequest !== requestId.current) return
      if (queryError) {
        setError(queryError.message)
        setAds([])
      } else {
        setAds(Array.isArray(data) ? data : [])
      }
    } catch (requestError) {
      if (currentRequest === requestId.current) {
        setError(requestError instanceof Error ? requestError.message : 'Unexpected error while loading advertisements.')
        setAds([])
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const startRequest = window.setTimeout(() => refresh(), 0)
    return () => {
      window.clearTimeout(startRequest)
      requestId.current += 1
    }
  }, [enabled, refresh])
  return { ads, loading, error, refresh }
}
