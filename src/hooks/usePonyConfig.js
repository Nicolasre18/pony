import { useCallback, useEffect, useState } from 'react'
import {
  ACCESSORIES,
  DEFAULT_CONFIG,
  randomConfig,
  sanitizeConfig,
} from '../data/palettes.js'

const STORAGE_KEY = 'mi-mundo-magico.pony.v1'

function loadConfig() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    return sanitizeConfig(JSON.parse(raw))
  } catch {
    return DEFAULT_CONFIG
  }
}

export function usePonyConfig() {
  const [config, setConfig] = useState(loadConfig)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch {
      // El almacenamiento puede estar deshabilitado; la app sigue funcionando.
    }
  }, [config])

  const update = useCallback((patch) => {
    setConfig((current) => ({ ...current, ...patch }))
  }, [])

  const toggleAccessory = useCallback((id) => {
    setConfig((current) => ({
      ...current,
      accessories: {
        ...current.accessories,
        [id]: !current.accessories[id],
      },
    }))
  }, [])

  const randomize = useCallback(() => setConfig(randomConfig()), [])

  const reset = useCallback(() => setConfig(DEFAULT_CONFIG), [])

  return {
    config,
    update,
    toggleAccessory,
    randomize,
    reset,
    accessories: ACCESSORIES,
  }
}
