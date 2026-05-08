import { ref, onMounted, onUnmounted } from 'vue'

export interface TVNavigationOptions {
  columns: number
  rows: number
  onSelect?: (index: number) => void
  onLeft?: () => void
  onRight?: () => void
  onUp?: () => void
  onDown?: () => void
}

export function useTVNavigation(options: TVNavigationOptions) {
  const currentIndex = ref(0)
  const isTVMode = ref(false)
  
  const totalItems = options.columns * options.rows
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        if (currentIndex.value >= options.columns) {
          currentIndex.value -= options.columns
          options.onUp?.()
        }
        break
        
      case 'ArrowDown':
        e.preventDefault()
        if (currentIndex.value + options.columns < totalItems) {
          currentIndex.value += options.columns
          options.onDown?.()
        }
        break
        
      case 'ArrowLeft':
        e.preventDefault()
        if (currentIndex.value % options.columns > 0) {
          currentIndex.value--
          options.onLeft?.()
        }
        break
        
      case 'ArrowRight':
        e.preventDefault()
        if (currentIndex.value % options.columns < options.columns - 1) {
          currentIndex.value++
          options.onRight?.()
        }
        break
        
      case 'Enter':
      case ' ':
        e.preventDefault()
        options.onSelect?.(currentIndex.value)
        break
        
      case 'Backspace':
      case 'Escape':
        e.preventDefault()
        break
    }
  }
  
  const checkIfTV = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    
    isTVMode.value = width >= 1280 || (width > height && width >= 1024)
    
    if (isTVMode.value) {
      document.body.classList.add('tv-navigation')
    } else {
      document.body.classList.remove('tv-navigation')
    }
  }
  
  onMounted(() => {
    checkIfTV()
    window.addEventListener('resize', checkIfTV)
    window.addEventListener('keydown', handleKeyDown)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', checkIfTV)
    window.removeEventListener('keydown', handleKeyDown)
  })
  
  const setIndex = (index: number) => {
    if (index >= 0 && index < totalItems) {
      currentIndex.value = index
    }
  }
  
  return {
    currentIndex,
    isTVMode,
    setIndex,
    totalItems,
  }
}

export function useTVRemote() {
  const isRemoteMode = ref(false)
  let backspaceCount = 0
  let backspaceTimer: ReturnType<typeof setTimeout> | null = null
  
  const KEYS_TO_DETECT = [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Enter', 'Backspace', 'MediaPlayPause', 'MediaStop'
  ]
  
  const handleKeyDown = (e: Event) => {
    const event = e as KeyboardEvent
    
    if (KEYS_TO_DETECT.includes(event.key)) {
      isRemoteMode.value = true
    }
    
    if (event.key === 'Backspace') {
      backspaceCount++
      
      if (backspaceTimer) {
        clearTimeout(backspaceTimer)
      }
      
      if (backspaceCount >= 5) {
        backspaceCount = 0
        return 'showParentPanel'
      }
      
      backspaceTimer = setTimeout(() => {
        backspaceCount = 0
      }, 2000)
    }
    
    return null
  }
  
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    if (backspaceTimer) {
      clearTimeout(backspaceTimer)
    }
  })
  
  return {
    isRemoteMode,
  }
}
