import { computed, onBeforeUnmount, reactive, ref, watch, watchEffect } from 'vue'
import { DEFAULT_SETTINGS, MODE_IDS, getMode } from '../constants/modes'
import { clamp, formatClock } from '../utils/time'
import { playSessionEndChime, unlockAudio } from './useNotificationSound'

const STORAGE_KEY = 'pomodoro-timer:v1'
const TICK_INTERVAL_MS = 200

const SETTING_LIMITS = {
  workMinutes: [1, 180],
  shortMinutes: [1, 60],
  longMinutes: [1, 120],
  longBreakInterval: [2, 12],
}

function sanitizeSettings(candidate = {}) {
  const settings = { ...DEFAULT_SETTINGS }

  for (const [key, [min, max]] of Object.entries(SETTING_LIMITS)) {
    const value = Number(candidate[key])
    if (Number.isFinite(value)) {
      settings[key] = clamp(Math.round(value), min, max)
    }
  }
  if (typeof candidate.soundEnabled === 'boolean') {
    settings.soundEnabled = candidate.soundEnabled
  }
  return settings
}

function readPersistedState() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function durationMs(settings, modeId) {
  const minutes = settings[getMode(modeId).settingKey]
  return Math.max(1, Math.round(minutes * 60 * 1000))
}

/**
 * Single source of truth for the Pomodoro timer:
 * modes, countdown, session counting, settings and persistence.
 */
export function usePomodoro() {
  const persisted = readPersistedState()

  const settings = reactive(sanitizeSettings(persisted.settings))
  const completedWorkSessions = ref(
    Number.isInteger(persisted.completedWorkSessions) && persisted.completedWorkSessions >= 0
      ? persisted.completedWorkSessions
      : 0,
  )
  const modeId = ref(MODE_IDS.includes(persisted.modeId) ? persisted.modeId : 'work')
  const status = ref('idle') // 'idle' | 'running' | 'paused'
  const remainingMs = ref(durationMs(settings, modeId.value))
  // Absolute timestamp of the moment the running session ends. Persisting a
  // deadline (rather than a countdown) lets a reload pick up exactly where the
  // clock is, including time spent on another page.
  const endsAt = ref(0)
  const announcement = ref('')

  let ticker = null

  const mode = computed(() => getMode(modeId.value))
  const totalMs = computed(() => durationMs(settings, modeId.value))
  const remainingSeconds = computed(() => Math.ceil(remainingMs.value / 1000))
  const displayTime = computed(() => formatClock(remainingSeconds.value))
  const progress = computed(() => {
    if (totalMs.value <= 0) return 0
    return clamp(1 - remainingMs.value / totalMs.value, 0, 1)
  })
  const isRunning = computed(() => status.value === 'running')
  const isPaused = computed(() => status.value === 'paused')
  const isIdle = computed(() => status.value === 'idle')
  const completedThisCycle = computed(() => {
    if (modeId.value === 'long') return settings.longBreakInterval
    return completedWorkSessions.value % settings.longBreakInterval
  })
  const sessionsToLongBreak = computed(() =>
    Math.max(0, settings.longBreakInterval - completedThisCycle.value),
  )

  function stopTicker() {
    if (ticker !== null) {
      window.clearInterval(ticker)
      ticker = null
    }
  }

  function startTicker() {
    stopTicker()
    ticker = window.setInterval(tick, TICK_INTERVAL_MS)
  }

  function finishSession({ notify = true } = {}) {
    stopTicker()
    endsAt.value = 0
    const finished = mode.value
    status.value = 'idle'

    if (finished.id === 'work') {
      completedWorkSessions.value += 1
    }

    const nextId =
      finished.id === 'work'
        ? completedWorkSessions.value % settings.longBreakInterval === 0
          ? 'long'
          : 'short'
        : 'work'

    if (notify && settings.soundEnabled) {
      playSessionEndChime()
    }

    modeId.value = nextId
    remainingMs.value = durationMs(settings, nextId)
    announcement.value =
      finished.id === 'work'
        ? `Work session complete. ${getMode(nextId).label} is ready when you are.`
        : `${finished.label} complete. Back to work when you are ready.`
  }

  function tick() {
    const remaining = endsAt.value - Date.now()
    if (remaining <= 0) {
      remainingMs.value = 0
      finishSession()
      return
    }
    remainingMs.value = remaining
  }

  function start() {
    if (status.value === 'running') return
    if (remainingMs.value <= 0) {
      remainingMs.value = totalMs.value
    }
    unlockAudio()
    endsAt.value = Date.now() + remainingMs.value
    status.value = 'running'
    startTicker()
    announcement.value = `${mode.value.label} timer started.`
  }

  function pause() {
    if (status.value !== 'running') return
    remainingMs.value = Math.max(0, endsAt.value - Date.now())
    endsAt.value = 0
    stopTicker()
    status.value = 'paused'
    announcement.value = `${mode.value.label} timer paused.`
  }

  function toggle() {
    if (status.value === 'running') {
      pause()
    } else {
      start()
    }
  }

  function reset() {
    stopTicker()
    endsAt.value = 0
    status.value = 'idle'
    remainingMs.value = totalMs.value
    announcement.value = `${mode.value.label} timer reset.`
  }

  function selectMode(nextId) {
    if (!MODE_IDS.includes(nextId) || nextId === modeId.value) return
    stopTicker()
    endsAt.value = 0
    modeId.value = nextId
    status.value = 'idle'
    remainingMs.value = durationMs(settings, nextId)
    announcement.value = `Switched to ${getMode(nextId).label}.`
  }

  /** Move on without finishing the session, so it is not counted. */
  function skip() {
    stopTicker()
    endsAt.value = 0
    const nextId = mode.value.id === 'work' ? 'short' : 'work'
    status.value = 'idle'
    modeId.value = nextId
    remainingMs.value = durationMs(settings, nextId)
    announcement.value = `Skipped to ${getMode(nextId).label}.`
  }

  function applySettings(patch) {
    Object.assign(settings, sanitizeSettings({ ...settings, ...patch }))
  }

  function restoreDefaults() {
    Object.assign(settings, { ...DEFAULT_SETTINGS })
    announcement.value = 'Timer durations restored to their defaults.'
  }

  function resetStats() {
    completedWorkSessions.value = 0
    announcement.value = 'Tracked work sessions reset to zero.'
  }

  function persistState() {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          settings: { ...settings },
          completedWorkSessions: completedWorkSessions.value,
          modeId: modeId.value,
          status: status.value,
          remainingMs: remainingMs.value,
          endsAt: endsAt.value,
        }),
      )
    } catch {
      // Storage can be unavailable (private mode, quota); the timer still works.
    }
  }

  // Rehydrate an in-flight session so a refresh does not restart the clock.
  function restoreTimer() {
    if (persisted.status === 'paused') {
      const savedRemaining = Number(persisted.remainingMs)
      if (Number.isFinite(savedRemaining) && savedRemaining > 0) {
        remainingMs.value = Math.min(savedRemaining, totalMs.value)
        status.value = 'paused'
        return
      }
    }

    if (persisted.status !== 'running') return

    const savedEndsAt = Number(persisted.endsAt)
    if (!Number.isFinite(savedEndsAt) || savedEndsAt <= 0) return

    const remaining = savedEndsAt - Date.now()
    if (remaining > 0) {
      endsAt.value = savedEndsAt
      remainingMs.value = remaining
      status.value = 'running'
      startTicker()
      return
    }

    // The session ran out while the page was closed, so advance past it once.
    remainingMs.value = 0
    finishSession({ notify: false })
  }

  restoreTimer()
  // Write the restored snapshot back right away, otherwise an expired session
  // would be re-applied (and counted again) on the next reload.
  persistState()

  // Keep an idle timer in sync with duration changes; a running countdown is
  // left alone, and a paused countdown is trimmed if it now exceeds its mode.
  watch(totalMs, (value) => {
    if (status.value === 'idle') {
      remainingMs.value = value
    } else if (status.value === 'paused' && remainingMs.value > value) {
      remainingMs.value = value
    }
  })

  // Persist the small slice of state worth restoring on reload.
  watch([settings, completedWorkSessions, modeId, status], persistState, { deep: true })

  watchEffect(() => {
    if (typeof document === 'undefined') return
    document.title =
      status.value === 'idle'
        ? `${mode.value.label} · Pomodoro Timer`
        : `${displayTime.value} · ${mode.value.label} · Pomodoro Timer`
  })

  onBeforeUnmount(stopTicker)

  return {
    announcement,
    applySettings,
    completedThisCycle,
    completedWorkSessions,
    displayTime,
    isIdle,
    isPaused,
    isRunning,
    mode,
    modeId,
    progress,
    remainingSeconds,
    reset,
    resetStats,
    restoreDefaults,
    selectMode,
    sessionsToLongBreak,
    settings,
    skip,
    start,
    status,
    toggle,
  }
}
