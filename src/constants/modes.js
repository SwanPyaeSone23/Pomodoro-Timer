/**
 * Session modes. `settingKey` maps a mode to the duration stored in settings
 * (in minutes), so adding a mode only needs one entry here.
 */
export const MODES = [
  {
    id: 'work',
    label: 'Work',
    settingKey: 'workMinutes',
    description: 'Focus on one task until the bell.',
  },
  {
    id: 'short',
    label: 'Short Break',
    settingKey: 'shortMinutes',
    description: 'Stand up, breathe, look away from the screen.',
  },
  {
    id: 'long',
    label: 'Long Break',
    settingKey: 'longMinutes',
    description: 'Step away for a while and recharge.',
  },
]

export const MODE_IDS = MODES.map((mode) => mode.id)

export const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortMinutes: 5,
  longMinutes: 15,
  longBreakInterval: 4,
  soundEnabled: true,
}

export function getMode(modeId) {
  return MODES.find((mode) => mode.id === modeId) ?? MODES[0]
}
