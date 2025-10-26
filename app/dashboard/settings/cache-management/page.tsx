"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MessageCircle, HardDrive, RefreshCw, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import SettingsCard from '@/components/settings/SettingsCard'
import { cacheManager, getCacheStats } from '@/lib/cache-manager'

export default function CacheManagementSettingsPage() {
  const { toast } = useToast()

  // Cache management state
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [loadingCache, setLoadingCache] = useState(false)

  useEffect(() => {
    loadCacheStats()
  }, [])

  const loadCacheStats = () => {
    setLoadingCache(true)
    try {
      const stats = getCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error('Error loading cache stats:', error)
    } finally {
      setLoadingCache(false)
    }
  }

  const handleClearAllCache = async () => {
    setLoadingCache(true)
    try {
      await cacheManager.clearAll()
      toast({
        title: "Cache Cleared",
        description: "All application cache has been cleared successfully. The page will reload to complete the process."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingCache(false)
    }
  }

  const handleClearVoiceCache = () => {
    try {
      cacheManager.clearVoiceCache()
      loadCacheStats()
      toast({
        title: "Voice Cache Cleared",
        description: "Voice command cache has been cleared successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear voice cache. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleClearLocalStorage = () => {
    try {
      cacheManager.clearLocalStorage()
      loadCacheStats()
      toast({
        title: "Local Storage Cleared",
        description: "Local storage has been cleared (theme settings preserved)."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear local storage. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Cache Management" subtitle="Monitor and clear application cache to improve performance">
        <div>
          {loadingCache ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading cache information...</p>
              </div>
            </div>
          ) : cacheStats ? (
            <div className="space-y-6">
              {/* Cache Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Voice Commands</h4>
                      <p className="text-2xl font-bold text-blue-700">{cacheStats.voiceCommands.total}</p>
                      <p className="text-sm text-blue-600">{cacheStats.voiceCommands.pending} pending</p>
                    </div>
                    <MessageCircle className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">Local Storage</h4>
                      <p className="text-2xl font-bold text-green-700">{cacheStats.localStorage.keys.length}</p>
                      <p className="text-sm text-green-600">{cacheManager.formatBytes(cacheStats.localStorage.totalSize)}</p>
                    </div>
                    <HardDrive className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-purple-900">Session Storage</h4>
                      <p className="text-2xl font-bold text-purple-700">{cacheStats.sessionStorage.keys.length}</p>
                      <p className="text-sm text-purple-600">{cacheManager.formatBytes(cacheStats.sessionStorage.totalSize)}</p>
                    </div>
                    <RefreshCw className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cache Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Cache Actions</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">Clear All Cache</h4>
                      <p className="text-sm text-gray-600">Clear all cached data and reload the page. Recommended if you're experiencing display issues.</p>
                    </div>
                    <Button 
                      onClick={handleClearAllCache}
                      disabled={loadingCache}
                      variant="destructive"
                      className="flex-shrink-0 w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">Clear Voice Cache</h4>
                      <p className="text-sm text-gray-600">Clear stored voice commands and speech recognition data.</p>
                    </div>
                    <Button 
                      onClick={handleClearVoiceCache}
                      disabled={loadingCache || cacheStats.voiceCommands.total === 0}
                      variant="outline"
                      className="flex-shrink-0 w-full sm:w-auto"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Clear Voice Cache
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">Clear Local Storage</h4>
                      <p className="text-sm text-gray-600">Clear locally stored data (theme settings will be preserved).</p>
                    </div>
                    <Button 
                      onClick={handleClearLocalStorage}
                      disabled={loadingCache || cacheStats.localStorage.keys.length === 0}
                      variant="outline"
                      className="flex-shrink-0 w-full sm:w-auto"
                    >
                      <HardDrive className="w-4 h-4 mr-2" />
                      Clear Local Storage
                    </Button>
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              {(cacheStats.localStorage.keys.length > 0 || cacheStats.sessionStorage.keys.length > 0) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Detailed Information</h3>
                    
                    {cacheStats.localStorage.keys.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Local Storage Keys</h4>
                        <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                          <code className="text-sm text-gray-700 break-words whitespace-normal">
                            {cacheStats.localStorage.keys.join(', ')}
                          </code>
                        </div>
                      </div>
                    )}
                    
                    {cacheStats.sessionStorage.keys.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Session Storage Keys</h4>
                        <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                          <code className="text-sm text-gray-700 break-words whitespace-normal">
                            {cacheStats.sessionStorage.keys.join(', ')}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cache data loaded</h3>
              <p className="text-gray-600 mb-4">Click the button below to load cache statistics.</p>
              <Button onClick={loadCacheStats} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Load Cache Stats
              </Button>
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Last updated: {cacheStats ? 'Just now' : 'Never'}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadCacheStats}
                disabled={loadingCache}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}