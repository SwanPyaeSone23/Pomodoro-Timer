/** Clamp a number into the inclusive [min, max] range. */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/** Format a number of seconds as MM:SS (minutes may grow past 60). */
export function formatClock(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
