<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: { type: Number, default: 0 },
})

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const dashOffset = computed(() => CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, props.progress))))
</script>

<template>
  <div class="timer-ring">
    <svg class="timer-ring__svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle class="timer-ring__track" cx="50" cy="50" :r="RADIUS" />
      <circle
        class="timer-ring__progress"
        cx="50"
        cy="50"
        :r="RADIUS"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <div class="timer-ring__content">
      <slot />
    </div>
  </div>
</template>
