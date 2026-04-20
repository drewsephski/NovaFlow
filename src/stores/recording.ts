import { create } from 'zustand'

interface RecordingState {
  // Recording state
  isRecording: boolean
  isPaused: boolean
  recordingDuration: number // Recording duration in seconds

  // Recording data
  audioChunks: Blob[]
  mediaRecorder: MediaRecorder | null

  // Timer
  timerId?: NodeJS.Timeout

  // Control methods
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => Promise<Blob | null>
  cancelRecording: () => void
  
  // Internal methods
  setRecordingDuration: (duration: number) => void
  resetState: () => void
}

const useRecordingStore = create<RecordingState>((set, get) => ({
  isRecording: false,
  isPaused: false,
  recordingDuration: 0,
  audioChunks: [],
  mediaRecorder: null,

  setRecordingDuration: (duration) => set({ recordingDuration: duration }),

  startRecording: async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('This environment does not support microphone recording. Please check Android WebView or app permission configuration.')
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Try more compatible formats first
      let mimeType = 'audio/webm'
      const supportedTypes = [
        'audio/wav',
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/webm'
      ]
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type
          break
        }
      }
      
      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      
      // Start timer, save to state
      const timerId = setInterval(() => {
        const state = get()
        if (state.isRecording && !state.isPaused) {
          set({ recordingDuration: state.recordingDuration + 1 })
        } else {
          // Clear timer when paused
          clearInterval(state.timerId)
          set({ timerId: undefined })
        }
      }, 1000)

      set({
        isRecording: true,
        isPaused: false,
        audioChunks: chunks,
        mediaRecorder,
        recordingDuration: 0,
        timerId
      })
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      
      // Provide more specific error messages based on error type
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied. Please allow NovaFlow to access microphone in system settings.')
        } else if (error.name === 'NotFoundError') {
          throw new Error('No microphone device detected. Please connect a microphone and try again.')
        } else if (error.name === 'NotReadableError') {
          throw new Error('Microphone is being used by another application. Please close other apps and try again.')
        }
      }
      
      throw new Error('Unable to start recording. Please check microphone device and permission settings.')
    }
  },

  pauseRecording: () => {
    const { mediaRecorder, timerId } = get()
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause()
      // Clear timer when paused
      if (timerId) {
        clearInterval(timerId)
      }
      set({ isPaused: true, timerId: undefined })
    }
  },

  resumeRecording: () => {
    const { mediaRecorder } = get()
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume()
      set({ isPaused: false })
    }
  },

  stopRecording: async (): Promise<Blob | null> => {
    const { mediaRecorder, audioChunks, timerId } = get()

    // Clear timer when stopped
    if (timerId) {
      clearInterval(timerId)
    }

    if (!mediaRecorder) {
      return null
    }
    
    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        get().resetState()
        resolve(audioBlob)
      }
      
      mediaRecorder.stop()
    })
  },

  cancelRecording: () => {
    const { mediaRecorder } = get()
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    
    get().resetState()
  },

  resetState: () => {
    const { timerId } = get()
    // Clear timer when resetting
    if (timerId) {
      clearInterval(timerId)
    }
    set({
      isRecording: false,
      isPaused: false,
      recordingDuration: 0,
      audioChunks: [],
      mediaRecorder: null,
      timerId: undefined
    })
  }
}))

export default useRecordingStore
