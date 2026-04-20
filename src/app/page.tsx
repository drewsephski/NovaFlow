'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__
}

// Dynamic imports for Tauri-only modules
const loadTauriModules = async () => {
  const [{ Store }, { isMobileDevice }] = await Promise.all([
    import('@tauri-apps/plugin-store'),
    import('@/lib/check')
  ])
  return { Store, isMobileDevice }
}

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      // Website visitors go to landing page
      if (!isTauriEnvironment()) {
        router.push('/')
        return
      }

      // Tauri app initialization
      try {
        const { Store, isMobileDevice } = await loadTauriModules()
        const store = await Store.load('store.json')
        
        // Check onboarding
        const hasCompletedOnboarding = await store.get<boolean>('hasCompletedOnboarding')
        if (!hasCompletedOnboarding) {
          router.push('/welcome')
          return
        }
        
        let currentPage = await store.get<string>('currentPage')
        
        if (isMobileDevice()) {
          if (currentPage?.includes('/mobile')) {
            router.push(currentPage || '/mobile/chat')
          } else {
            router.push('/mobile/chat')
          }
        } else {
          // Redirect old paths
          if (currentPage === '/core/article' || currentPage === '/core/record') {
            currentPage = '/core/main'
            await store.set('currentPage', '/core/main')
            await store.save()
          }
          
          if (!currentPage?.includes('/mobile')) {
            router.push(currentPage || '/core/main')
          } else {
            router.push('/core/main')
          }
        }
      } catch (error) {
        console.error('Tauri init error:', error)
        router.push('/core/main')
      }
    }

    init()
  }, [router])

  // Show nothing while determining where to redirect
  return null
}

// Helper function to mark onboarding as complete
export async function completeOnboarding(): Promise<void> {
  if (!isTauriEnvironment()) return
  const { Store } = await import('@tauri-apps/plugin-store')
  const store = await Store.load('store.json')
  await store.set('hasCompletedOnboarding', true)
  await store.save()
}
