<script setup>
import { ref } from 'vue'

const props = defineProps({
  modes: { type: Array, required: true },
  modelValue: { type: String, required: true },
  // While a session runs the other tabs are unavailable, so a stray click
  // cannot abandon the countdown.
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const tabElements = ref([])

function setTabRef(element, index) {
  tabElements.value[index] = element
}

function select(modeId) {
  emit('update:modelValue', modeId)
}

function focusTab(index) {
  select(props.modes[index].id)
  tabElements.value[index]?.focus()
}

function isLocked(modeId) {
  return props.locked && modeId !== props.modelValue
}

function onKeydown(event, index) {
  // Arrow keys cannot reach the locked tabs either.
  if (props.locked) return

  const lastIndex = props.modes.length - 1
  let nextIndex = null

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      nextIndex = index === lastIndex ? 0 : index + 1
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      nextIndex = index === 0 ? lastIndex : index - 1
      break
    case 'Home':
      nextIndex = 0
      break
    case 'End':
      nextIndex = lastIndex
      break
    default:
      return
  }

  event.preventDefault()
  focusTab(nextIndex)
}
</script>

<template>
  <div class="tabs" role="tablist" aria-label="Session type">
    <button
      v-for="(mode, index) in modes"
      :id="`tab-${mode.id}`"
      :key="mode.id"
      :ref="(element) => setTabRef(element, index)"
      type="button"
      role="tab"
      class="tabs__tab"
      :aria-selected="modelValue === mode.id"
      :aria-controls="'timer-panel'"
      :tabindex="modelValue === mode.id ? 0 : -1"
      :disabled="isLocked(mode.id)"
      :title="isLocked(mode.id) ? 'Pause or reset the timer to switch session type' : undefined"
      @click="select(mode.id)"
      @keydown="onKeydown($event, index)"
    >
      {{ mode.label }}
    </button>
  </div>
</template>
