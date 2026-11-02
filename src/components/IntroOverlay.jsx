import { useState } from 'react'
import { Music2, Sparkles } from 'lucide-react'
import Switch from './Switch.jsx'

export default function IntroOverlay({ leaving, onStart, initialMusic = true }) {
  const [music, setMusic] = useState(initialMusic)

  return (
    <div className={`intro${leaving ? ' is-leaving' : ''}`}>
      <div className="intro__halo" aria-hidden="true" />
      <div className="intro__sparkles" aria-hidden="true">
        <span style={{ left: '16%', top: '22%', animationDelay: '0s' }}>✦</span>
        <span style={{ left: '82%', top: '18%', animationDelay: '1.2s' }}>✦</span>
        <span style={{ left: '10%', top: '68%', animationDelay: '2.1s' }}>✦</span>
        <span style={{ left: '88%', top: '62%', animationDelay: '0.6s' }}>✦</span>
        <span style={{ left: '23%', top: '41%', animationDelay: '1.7s' }}>✦</span>
        <span style={{ left: '74%', top: '78%', animationDelay: '2.6s' }}>✦</span>
      </div>
      <div className="intro__card">
        <div className="intro__emblem" aria-hidden="true">
          <Sparkles size={30} />
          <span>✦</span>
        </div>
        <p className="intro__eyebrow">Un jardín de fantasía te espera</p>
        <h2 className="intro__title" id="intro-title">
          Mi Mundo Mágico
        </h2>
        <p className="intro__text">
          Conoce a <strong>Luna</strong>, una pony alicornio que vive entre
          nubes de algodón y estrellas. Juega con su melena, acaríciala y crea
          el look más adorable.
        </p>
        <button
          type="button"
          className="btn btn--primary intro__enter"
          onClick={() => onStart({ music })}
        >
          <Sparkles size={18} />
          Entrar en la magia
        </button>
        <div className="intro__sound">
          <span className="intro__sound-label">
            <Music2 size={16} />
            Música de ensueño
          </span>
          <Switch
            checked={music}
            onChange={setMusic}
            label="Activar música de ensueño al entrar"
          />
        </div>
        <p className="intro__tip">
          Usa el ratón o el dedo para girar a Luna · Todo se guarda en tu
          navegador
        </p>
      </div>
    </div>
  )
}
