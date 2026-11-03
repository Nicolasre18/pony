import { useCallback, useEffect, useRef, useState } from 'react'
import { Moon, MousePointer2, Sparkles, Sun } from 'lucide-react'
import MagicalBackground from './components/MagicalBackground.jsx'
import IntroOverlay from './components/IntroOverlay.jsx'
import Scene from './components/Scene.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import ActionDock from './components/ActionDock.jsx'
import { usePonyConfig } from './hooks/usePonyConfig.js'
import {
  useMediaQuery,
  usePageVisible,
  useReducedMotion,
} from './hooks/useEnvironment.js'
import { audio } from './audio/audioEngine.js'

const SOUND_KEY = 'mi-mundo-magico.sound.v1'

const PET_MESSAGES = [
  '¡Qué cosquillas! ✨',
  'Me encanta cuando me acaricias 💕',
  '¡Otra vez, por favor! 🌸',
  'Brrr… ¡qué cosquillas! ⭐',
  'Mi corazón brilla de alegría 💖',
]

function loadSoundPrefs() {
  try {
    const raw = window.localStorage.getItem(SOUND_KEY)
    if (!raw) return { music: true, sfx: true, volume: 0.6 }
    const parsed = JSON.parse(raw)
    return {
      music: typeof parsed.music === 'boolean' ? parsed.music : true,
      sfx: typeof parsed.sfx === 'boolean' ? parsed.sfx : true,
      volume:
        typeof parsed.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 1
          ? parsed.volume
          : 0.6,
    }
  } catch {
    return { music: true, sfx: true, volume: 0.6 }
  }
}

export default function App() {
  const { config, update, toggleAccessory, randomize, reset } = usePonyConfig()
  const isMobile = useMediaQuery('(max-width: 900px)')
  const reducedMotion = useReducedMotion()
  const pageVisible = usePageVisible()

  const prefs = useRef(loadSoundPrefs())
  const [entered, setEntered] = useState(false)
  const [introMounted, setIntroMounted] = useState(true)
  const [introLeaving, setIntroLeaving] = useState(false)
  const [musicOn, setMusicOn] = useState(prefs.current.music)
  const [sfxOn, setSfxOn] = useState(prefs.current.sfx)
  const [volume, setVolume] = useState(prefs.current.volume)

  const [action, setAction] = useState('idle')
  const [actionKey, setActionKey] = useState(0)
  const [petKey, setPetKey] = useState(0)
  const [resetSignal, setResetSignal] = useState(0)
  const [toast, setToast] = useState(null)
  const [nightMode, setNightMode] = useState(false)

  const actionTimer = useRef()
  const toastTimer = useRef()
  const introTimer = useRef()

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SOUND_KEY,
        JSON.stringify({ music: musicOn, sfx: sfxOn, volume }),
      )
    } catch {
      /* sin almacenamiento, sin problema */
    }
  }, [musicOn, sfxOn, volume])

  useEffect(() => {
    audio.setSfxEnabled(sfxOn)
  }, [sfxOn])

  useEffect(() => {
    audio.setVolume(volume)
  }, [volume])

  useEffect(() => {
    if (action !== 'walk') return undefined
    const id = window.setInterval(() => audio.playWalkStep(), 460)
    return () => window.clearInterval(id)
  }, [action])

  useEffect(() => {
    return () => {
      if (actionTimer.current) window.clearTimeout(actionTimer.current)
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
      if (introTimer.current) window.clearTimeout(introTimer.current)
      audio.stopMusic()
    }
  }, [])

  const showToast = useCallback((text, duration = 2400) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast({ text, key: Date.now() })
    toastTimer.current = window.setTimeout(() => setToast(null), duration)
  }, [])

  useEffect(() => {
    if (!entered) return undefined
    const id = window.setTimeout(() => {
      showToast('¡Hola! Soy Luna ✦', 3200)
    }, 1150)
    return () => window.clearTimeout(id)
  }, [entered, showToast])

  const startAction = useCallback((name, duration) => {
    if (actionTimer.current) window.clearTimeout(actionTimer.current)
    setAction(name)
    setActionKey((key) => key + 1)
    actionTimer.current = window.setTimeout(() => {
      setAction('idle')
      setActionKey((key) => key + 1)
    }, duration)
  }, [])

  const handleStart = ({ music }) => {
    setEntered(true)
    setIntroLeaving(true)
    setMusicOn(music)
    if (music) audio.setMusicEnabled(true)
    if (introTimer.current) window.clearTimeout(introTimer.current)
    introTimer.current = window.setTimeout(() => setIntroMounted(false), 850)
  }

  const handlePet = () => {
    startAction('pet', 2800)
    setPetKey((key) => key + 1)
    audio.playPet()
    showToast(PET_MESSAGES[Math.floor(Math.random() * PET_MESSAGES.length)])
  }

  const handleWalk = () => {
    startAction('walk', 9600)
    audio.playMagic()
    showToast('¡Vamos a pasear por el jardín! 🌈', 2600)
  }

  const handleToggleMusic = () => {
    const next = !musicOn
    setMusicOn(next)
    audio.setMusicEnabled(next)
    if (next) audio.playChime()
  }

  const handleToggleSfx = (enabled) => {
    setSfxOn(enabled)
    if (enabled) audio.playChime()
  }

  const handleVolume = (value) => {
    setVolume(value)
    audio.setVolume(value)
  }

  const handleRandomize = () => {
    randomize()
    audio.playMagic()
    showToast('¡Un look digno de un cuento! ✨')
  }

  const handleReset = () => {
    reset()
    audio.playChime()
    showToast('Luna vuelve a su look original 🌷')
  }

  const handleResetView = () => {
    setResetSignal((signal) => signal + 1)
    audio.playChime()
  }

  const handlePreview = () => {
    audio.playPaint()
  }

  return (
    <div className={`app${entered ? ' is-entered' : ''}${nightMode ? ' is-night' : ''}`}>
      <MagicalBackground nightMode={nightMode} />

      {introMounted ? (
        <IntroOverlay
          leaving={introLeaving}
          onStart={handleStart}
          initialMusic={prefs.current.music}
        />
      ) : null}

      <header className="hero">
        <div className="hero__badge">
          <Sparkles size={13} />
          El jardín de Luna
        </div>
        <h1 className="hero__title">Mi Mundo Mágico</h1>
        <p className="hero__tagline">Crea, juega y sueña con tu pony alicornio.</p>
      </header>

      <button
        type="button"
        className="theme-toggle"
        onClick={() => setNightMode((value) => !value)}
        aria-pressed={nightMode}
        aria-label={nightMode ? 'Activar modo día' : 'Activar modo noche'}
        title={nightMode ? 'Modo día' : 'Modo noche'}
      >
        {nightMode ? <Sun size={17} /> : <Moon size={17} />}
        <span>{nightMode ? 'Día' : 'Noche'}</span>
      </button>

      <main className="stage-wrap">
        <div className="canvas-layer">
          <Scene
            config={config}
            action={action}
            actionKey={actionKey}
            petKey={petKey}
            entered={entered}
            resetSignal={resetSignal}
            isMobile={isMobile}
            reducedMotion={reducedMotion}
            pageVisible={pageVisible}
            nightMode={nightMode}
          />
        </div>

        <div className="stage-hint" aria-hidden="true">
          <MousePointer2 size={13} />
          {isMobile
            ? 'Toca y arrastra para girar a Luna'
            : 'Arrastra para girar · Rueda o pellizca para acercarte'}
        </div>

        {toast ? (
          <div key={toast.key} className="pet-toast" role="status" aria-live="polite">
            {toast.text}
          </div>
        ) : null}

        <ActionDock
          onPet={handlePet}
          onWalk={handleWalk}
          onToggleMusic={handleToggleMusic}
          onResetView={handleResetView}
          walking={action === 'walk'}
          petting={action === 'pet'}
          musicOn={musicOn}
        />
      </main>

      <ControlPanel
        config={config}
        update={update}
        toggleAccessory={toggleAccessory}
        randomize={handleRandomize}
        reset={handleReset}
        musicOn={musicOn}
        onToggleMusic={handleToggleMusic}
        volume={volume}
        onVolumeChange={handleVolume}
        sfxOn={sfxOn}
        onToggleSfx={handleToggleSfx}
        onPreview={handlePreview}
      />

      <footer className="site-footer">
        <span>✦ Hecho con polvo de estrellas</span>
        <span className="site-footer__dot">·</span>
        <span>Tu look se guarda automáticamente</span>
      </footer>
    </div>
  )
}
