import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface TimelineState {
  // Time
  currentTime: Date
  setCurrentTime: (time: Date) => void
  startTime: Date
  setStartTime: (time: Date) => void
  endTime: Date
  setEndTime: (time: Date) => void
  setTimeRange: (start: Date, end: Date) => void

  // Playback
  isPlaying: boolean
  setPlaying: (playing: boolean) => void
  togglePlayback: () => void
  playbackSpeed: number
  setPlaybackSpeed: (speed: number) => void

  // Playback modes
  playbackMode: 'realtime' | 'historical' | 'simulation'
  setPlaybackMode: (mode: 'realtime' | 'historical' | 'simulation') => void

  // Loop
  isLooping: boolean
  setLooping: (looping: boolean) => void
  toggleLooping: () => void

  // Actions
  play: () => void
  pause: () => void
  stop: () => void
  skipForward: (seconds: number) => void
  skipBackward: (seconds: number) => void
  goToTime: (time: Date) => void
  goToStart: () => void
  goToEnd: () => void
  resetTimeline: () => void

  // Helpers
  getProgress: () => number
  getTotalDuration: () => number
  getElapsedTime: () => number
  getRemainingTime: () => number
}

const now = new Date()
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

export const useTimelineStore = create<TimelineState>()(
  devtools(
    (set, get) => ({
      // Time
      currentTime: now,
      setCurrentTime: (time) => set({ currentTime: time }),
      startTime: oneDayAgo,
      setStartTime: (time) => set({ startTime: time }),
      endTime: now,
      setEndTime: (time) => set({ endTime: time }),
      setTimeRange: (start, end) => set({ startTime: start, endTime: end }),

      // Playback
      isPlaying: false,
      setPlaying: (playing) => set({ isPlaying: playing }),
      togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
      playbackSpeed: 1,
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

      // Playback modes
      playbackMode: 'historical',
      setPlaybackMode: (mode) => set({ playbackMode: mode }),

      // Loop
      isLooping: false,
      setLooping: (looping) => set({ isLooping: looping }),
      toggleLooping: () => set((state) => ({ isLooping: !state.isLooping })),

      // Actions
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      stop: () =>
        set((state) => ({
          isPlaying: false,
          currentTime: state.startTime
        })),

      skipForward: (seconds) =>
        set((state) => ({
          currentTime: new Date(state.currentTime.getTime() + seconds * 1000)
        })),

      skipBackward: (seconds) =>
        set((state) => ({
          currentTime: new Date(state.currentTime.getTime() - seconds * 1000)
        })),

      goToTime: (time) => set({ currentTime: time }),

      goToStart: () =>
        set((state) => ({
          currentTime: state.startTime,
          isPlaying: false
        })),

      goToEnd: () =>
        set((state) => ({
          currentTime: state.endTime,
          isPlaying: false
        })),

      resetTimeline: () => {
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        set({
          currentTime: now,
          startTime: oneDayAgo,
          endTime: now,
          isPlaying: false,
          playbackSpeed: 1,
          isLooping: false,
          playbackMode: 'historical'
        })
      },

      // Helpers
      getProgress: () => {
        const { currentTime, startTime, endTime } = get()
        const total = endTime.getTime() - startTime.getTime()
        const elapsed = currentTime.getTime() - startTime.getTime()
        return total > 0 ? (elapsed / total) * 100 : 0
      },

      getTotalDuration: () => {
        const { startTime, endTime } = get()
        return endTime.getTime() - startTime.getTime()
      },

      getElapsedTime: () => {
        const { currentTime, startTime } = get()
        return currentTime.getTime() - startTime.getTime()
      },

      getRemainingTime: () => {
        const { currentTime, endTime } = get()
        return endTime.getTime() - currentTime.getTime()
      }
    }),
    { name: 'TimelineStore' }
  )
)
