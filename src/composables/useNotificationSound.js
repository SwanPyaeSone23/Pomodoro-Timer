/**
 * Tiny Web Audio chime used when a session ends. Generating the tone avoids
 * shipping an audio file and works offline.
 */
let audioContext = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext
  if (!AudioContextCtor) return null
  if (!audioContext) {
    try {
      audioContext = new AudioContextCtor()
    } catch {
      audioContext = null
    }
  }
  return audioContext
}

/**
 * Browsers only allow audio after a user gesture, so call this from a click or
 * key press (the start button/shortcut) to unlock playback.
 */
export function unlockAudio() {
  const ctx = getAudioContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

/** Play a short three-note ascending chime. */
export function playSessionEndChime() {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  const notes = [
    { frequency: 659.25, delay: 0, duration: 0.35 },
    { frequency: 783.99, delay: 0.18, duration: 0.35 },
    { frequency: 1046.5, delay: 0.36, duration: 0.75 },
  ]
  const now = ctx.currentTime

  notes.forEach(({ frequency, delay, duration }) => {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    const startAt = now + delay

    oscillator.type = 'sine'
    oscillator.frequency.value = frequency

    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(startAt)
    oscillator.stop(startAt + duration + 0.05)
  })
}
