<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: 'idle' },
  modeLabel: { type: String, default: 'Work' },
})

const emit = defineEmits(['toggle', 'reset', 'skip'])

const primaryLabel = computed(() => {
  if (props.status === 'running') return 'Pause'
  if (props.status === 'paused') return 'Resume'
  return 'Start'
})

const primaryActionLabel = computed(() => `${primaryLabel.value} ${props.modeLabel} timer`)
</script>

<template>
  <div class="controls">
    <button
      type="button"
      class="button button--ghost"
      aria-label="Reset timer"
      @click="emit('reset')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7Z"
          fill="currentColor"
        />
      </svg>
      <span>Reset</span>
    </button>

    <button
      type="button"
      class="button button--primary"
      :aria-label="primaryActionLabel"
      @click="emit('toggle')"
    >
      <svg v-if="status === 'running'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
        <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 5.2v13.6L19 12 8 5.2Z" fill="currentColor" />
      </svg>
      <span>{{ primaryLabel }}</span>
    </button>

    <button
      type="button"
      class="button button--ghost"
      aria-label="Skip to next session"
      @click="emit('skip')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6 5l9 7-9 7V5Z" fill="currentColor" />
        <rect x="16.5" y="5" width="2.5" height="14" rx="1" fill="currentColor" />
      </svg>
      <span>Skip</span>
    </button>
  </div>
</template>
