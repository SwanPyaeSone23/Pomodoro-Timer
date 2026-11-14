<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SessionStats from './components/SessionStats.vue'
import SessionTabs from './components/SessionTabs.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import TimerControls from './components/TimerControls.vue'
import TimerRing from './components/TimerRing.vue'
import { MODES } from './constants/modes'
import { usePomodoro } from './composables/usePomodoro'

const {
  announcement,
  applySettings,
  completedThisCycle,
  completedWorkSessions,
  displayTime,
  isRunning,
  mode,
  modeId,
  progress,
  reset,
  resetStats,
  restoreDefaults,
  selectMode,
  sessionsToLongBreak,
  settings,
  skip,
  status,
  toggle,
} = usePomodoro()

const isSettingsOpen = ref(false)
const settingsButton = ref(null)

const statusLabel = computed(() => {
  if (isRunning.value) return 'In progress'
  if (status.value === 'paused') return 'Paused — take your time'
  return 'Ready when you are'
})

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  )
}

function handleShortcut(event) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
  if (isSettingsOpen.value || isTypingTarget(event.target)) return

  // Space should activate a focused button rather than hijack it.
  const focusedButton = event.target instanceof HTMLElement ? event.target.closest('button') : null
  if (event.code === 'Space' && focusedButton) return

  const key = event.key.toLowerCase()

  if (event.code === 'Space' || key === 'k') {
    event.preventDefault()
    toggle()
    return
  }
  if (key === 'r') {
    event.preventDefault()
    reset()
    return
  }
  if (key === 's') {
    event.preventDefault()
    skip()
    return
  }
  if (key === '1' || key === '2' || key === '3') {
    event.preventDefault()
    selectMode(MODES[Number(key) - 1].id)
  }
}

// Return focus to the trigger when the settings dialog closes.
watch(isSettingsOpen, (open) => {
  if (!open) settingsButton.value?.focus()
})

onMounted(() => window.addEventListener('keydown', handleShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', handleShortcut))
</script>

<template>
  <a class="skip-link" href="#main">Skip to timer</a>

  <div class="app" :data-mode="mode.id">
    <header class="app__header">
      <div class="brand">
        <span class="brand__mark" aria-hidden="true">🍅</span>
        <div class="brand__text">
          <h1 class="brand__title">Pomodoro</h1>
          <p class="brand__subtitle">Focus. Rest. Repeat.</p>
        </div>
      </div>

      <button
        ref="settingsButton"
        type="button"
        class="icon-button"
        aria-label="Open timer settings"
        aria-haspopup="dialog"
        :aria-expanded="isSettingsOpen"
        @click="isSettingsOpen = true"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle
            cx="12"
            cy="12"
            r="3.2"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </header>

    <main id="main" class="board">
      <section class="timer-card" aria-labelledby="timer-heading">
        <h2 id="timer-heading" class="visually-hidden">Pomodoro timer</h2>

        <SessionTabs
          :modes="MODES"
          :model-value="modeId"
          :locked="isRunning"
          @update:model-value="selectMode"
        />

        <div
          id="timer-panel"
          class="timer-card__panel"
          role="tabpanel"
          :aria-labelledby="`tab-${mode.id}`"
        >
          <TimerRing :progress="progress">
            <p class="timer__mode">{{ mode.label }}</p>
            <p class="timer__time">{{ displayTime }}</p>
            <p class="timer__hint">{{ statusLabel }}</p>
          </TimerRing>

          <TimerControls
            :status="status"
            :mode-label="mode.label"
            @toggle="toggle"
            @reset="reset"
            @skip="skip"
          />
        </div>

        <p class="timer-card__description">{{ mode.description }}</p>
      </section>

      <div class="side-column">
        <SessionStats
          :completed-sessions="completedWorkSessions"
          :completed-this-cycle="completedThisCycle"
          :interval="settings.longBreakInterval"
          :sessions-to-long-break="sessionsToLongBreak"
        />

        <section class="shortcuts" aria-labelledby="shortcuts-heading">
          <h2 id="shortcuts-heading" class="shortcuts__heading">Keyboard shortcuts</h2>
          <ul class="shortcuts__list">
            <li><kbd>Space</kbd><span>Start, pause or resume</span></li>
            <li><kbd>R</kbd><span>Reset the timer</span></li>
            <li><kbd>S</kbd><span>Skip to the next session</span></li>
            <li><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><span>Switch session type</span></li>
          </ul>
        </section>
      </div>
    </main>

    <footer class="app__footer">
      <p>Work {{ settings.workMinutes }} min · Short break {{ settings.shortMinutes }} min · Long break {{ settings.longMinutes }} min</p>
    </footer>

    <SettingsDialog
      :open="isSettingsOpen"
      :settings="settings"
      @close="isSettingsOpen = false"
      @update="applySettings"
      @restore-defaults="restoreDefaults"
      @reset-stats="resetStats"
    />

    <div class="visually-hidden" role="status" aria-live="polite">{{ announcement }}</div>
  </div>
</template>
