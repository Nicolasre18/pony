import { Footprints, Heart, Music2, RotateCcw } from 'lucide-react'

function Equalizer() {
  return (
    <span className="equalizer" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  )
}

export default function ActionDock({
  onPet,
  onWalk,
  onToggleMusic,
  onResetView,
  walking,
  petting,
  musicOn,
}) {
  return (
    <div className="action-dock" role="toolbar" aria-label="Acciones con Luna">
      <button
        type="button"
        className={`dock__btn dock__btn--primary${petting ? ' is-active' : ''}`}
        onClick={onPet}
        aria-label="Acariciar a Luna"
        title="Acariciar a Luna"
      >
        <span className="dock__icon">
          <Heart size={21} fill={petting ? 'currentColor' : 'none'} />
        </span>
        <span className="dock__label">Acariciar</span>
      </button>
      <button
        type="button"
        className={`dock__btn${walking ? ' is-active' : ''}`}
        onClick={onWalk}
        aria-label="Pasear por el jardín"
        aria-pressed={walking}
        title="Pasear por el jardín"
      >
        <span className="dock__icon">
          <Footprints size={21} />
        </span>
        <span className="dock__label">Pasear</span>
      </button>
      <button
        type="button"
        className={`dock__btn${musicOn ? ' is-active' : ''}`}
        onClick={onToggleMusic}
        aria-label={musicOn ? 'Silenciar la música' : 'Activar la música'}
        aria-pressed={musicOn}
        title={musicOn ? 'Silenciar la música' : 'Activar la música'}
      >
        <span className="dock__icon">
          {musicOn ? <Equalizer /> : <Music2 size={21} />}
        </span>
        <span className="dock__label">Música</span>
      </button>
      <button
        type="button"
        className="dock__btn"
        onClick={onResetView}
        aria-label="Restablecer la vista de la cámara"
        title="Restablecer la vista"
      >
        <span className="dock__icon">
          <RotateCcw size={20} />
        </span>
        <span className="dock__label">Vista</span>
      </button>
    </div>
  )
}
