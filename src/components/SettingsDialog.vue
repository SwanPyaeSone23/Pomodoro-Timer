<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  settings: { type: Object, required: true },
})

const emit = defineEmits(['close', 'update', 'restore-defaults', 'reset-stats'])

const DURATION_FIELDS = [
  { key: 'workMinutes', label: 'Work session', description: 'Length of a focus block', unit: 'min' },
  { key: 'shortMinutes', label: 'Short break', description: 'After every work session', unit: 'min' },
  { key: 'longMinutes', label: 'Long break', description: 'After a full cycle', unit: 'min' },
]

const LIMITS = {
  workMinutes: [1, 180],
  shortMinutes: [1, 60],
  longMinutes: [1, 120],
  longBreakInterval: [2, 12],
}

const dialogRef = ref(null)
const firstFieldRef = ref(null)

function setFieldRef(element, index) {
  if (index === 0) firstFieldRef.value = element
}

function updateNumber(key, event) {
  const [min, max] = LIMITS[key]
  const parsed = Number.parseInt(event.target.value, 10)
  const value = Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : props.settings[key]
  event.target.value = String(value)
  emit('update', { [key]: value })
}

function updateSound(event) {
  emit('update', { soundEnabled: event.target.checked })
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !dialogRef.value) return

  const focusable = dialogRef.value.querySelectorAll(
    'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])',
  )
  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      await nextTick()
      firstFieldRef.value?.focus()
    }
  },
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dialog-overlay" @click.self="emit('close')" @keydown="onKeydown">
      <div
        ref="dialogRef"
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        aria-describedby="settings-description"
      >
        <div class="dialog__header">
          <div>
            <h2 id="settings-title" class="dialog__title">Timer settings</h2>
            <p id="settings-description" class="dialog__subtitle">
              Tune your rhythm. Changes apply to the next session.
            </p>
          </div>
          <button type="button" class="icon-button" aria-label="Close settings" @click="emit('close')">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <div class="dialog__body">
          <div
            v-for="(field, index) in DURATION_FIELDS"
            :key="field.key"
            class="field"
          >
            <label class="field__label" :for="`setting-${field.key}`">{{ field.label }}</label>
            <p class="field__description">{{ field.description }}</p>
            <div class="field__control">
              <input
                :id="`setting-${field.key}`"
                :ref="(element) => setFieldRef(element, index)"
                class="field__input"
                type="number"
                inputmode="numeric"
                :min="LIMITS[field.key]?.[0]"
                :max="LIMITS[field.key]?.[1]"
                step="1"
                :value="settings[field.key]"
                @change="updateNumber(field.key, $event)"
              />
              <span class="field__unit" aria-hidden="true">{{ field.unit }}</span>
            </div>
          </div>

          <div class="field">
            <label class="field__label" for="setting-longBreakInterval">Long break interval</label>
            <p class="field__description">Work sessions before a long break</p>
            <div class="field__control">
              <input
                id="setting-longBreakInterval"
                class="field__input"
                type="number"
                inputmode="numeric"
                :min="LIMITS.longBreakInterval?.[0]"
                :max="LIMITS.longBreakInterval?.[1]"
                step="1"
                :value="settings.longBreakInterval"
                @change="updateNumber('longBreakInterval', $event)"
              />
              <span class="field__unit" aria-hidden="true">sessions</span>
            </div>
          </div>

          <div class="switch">
            <div>
              <label class="field__label" for="setting-soundEnabled">End-of-session chime</label>
              <p class="field__description">Play a short sound when a session ends</p>
            </div>
            <input
              id="setting-soundEnabled"
              class="switch__input"
              type="checkbox"
              role="switch"
              :checked="settings.soundEnabled"
              @change="updateSound"
            />
          </div>
        </div>

        <div class="dialog__footer">
          <button type="button" class="button button--ghost" @click="emit('restore-defaults')">
            Restore defaults
          </button>
          <button type="button" class="button button--ghost" @click="emit('reset-stats')">
            Reset sessions
          </button>
          <button type="button" class="button button--primary" @click="emit('close')">Done</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
