<script setup>
import { computed } from 'vue'

const props = defineProps({
  completedSessions: { type: Number, default: 0 },
  completedThisCycle: { type: Number, default: 0 },
  interval: { type: Number, default: 4 },
  sessionsToLongBreak: { type: Number, default: 4 },
})

const dots = computed(() =>
  Array.from({ length: props.interval }, (_, index) => index < props.completedThisCycle),
)

const cycleSummary = computed(
  () => `${props.completedThisCycle} of ${props.interval} work sessions completed in this cycle`,
)
</script>

<template>
  <section class="stats" aria-labelledby="stats-heading">
    <div class="stats__header">
      <h2 id="stats-heading" class="stats__heading">Session progress</h2>
      <span class="stats__badge">{{ completedSessions }} total</span>
    </div>

    <p class="stats__value">
      <span class="stats__number">{{ completedSessions }}</span>
      <span class="stats__label">
        work {{ completedSessions === 1 ? 'session' : 'sessions' }} tracked
      </span>
    </p>

    <ul class="cycle" :aria-label="cycleSummary">
      <li
        v-for="(filled, index) in dots"
        :key="index"
        class="cycle__dot"
        :class="{ 'cycle__dot--filled': filled }"
      >
        <span class="visually-hidden">{{ filled ? 'Completed' : 'Pending' }} session {{ index + 1 }}</span>
      </li>
    </ul>

    <p class="stats__hint">
      <template v-if="sessionsToLongBreak === 0">
        Long break unlocked — you have earned it.
      </template>
      <template v-else>
        Long break after {{ sessionsToLongBreak }} more
        {{ sessionsToLongBreak === 1 ? 'session' : 'sessions' }}.
      </template>
    </p>
  </section>
</template>
