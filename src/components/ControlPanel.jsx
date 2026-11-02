import { useRef, useState } from 'react'
import {
  Check,
  Crown,
  Dices,
  Feather,
  Flower2,
  Music2,
  Palette,
  Ribbon,
  RotateCcw,
  Sparkles,
  Star,
  Volume2,
  Wand2,
} from 'lucide-react'
import {
  ACCESSORIES,
  COAT_COLORS,
  EYE_COLORS,
  MANE_COLORS,
  MANE_STYLES,
  TAIL_COLORS,
} from '../data/palettes.js'
import Switch from './Switch.jsx'

const ACCESSORY_ICONS = {
  tiara: Crown,
  bow: Ribbon,
  flower: Flower2,
  necklace: Star,
  wings: Feather,
}

const TABS = [
  { id: 'colors', label: 'Colores', icon: Palette },
  { id: 'style', label: 'Estilo', icon: Wand2 },
  { id: 'sound', label: 'Sonido', icon: Volume2 },
]

function SwatchRow({ label, colors, value, onChange }) {
  const selected = colors.find((color) => color.value === value)
  return (
    <div className="swatch-row">
      <div className="swatch-row__head">
        <span className="swatch-row__label">{label}</span>
        <span className="swatch-row__value">{selected?.name ?? 'Personalizado'}</span>
      </div>
      <div className="swatches" role="group" aria-label={`Color de ${label.toLowerCase()}`}>
        {colors.map((color) => {
          const active = color.value === value
          return (
            <button
              key={color.value}
              type="button"
              className={`swatch${active ? ' is-active' : ''}`}
              style={{ '--swatch': color.value }}
              aria-label={color.name}
              aria-pressed={active}
              title={color.name}
              onClick={() => onChange(color.value)}
            >
              <span className="swatch__dot" />
              {active ? <Check className="swatch__check" size={13} strokeWidth={3} /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ControlPanel({
  config,
  update,
  toggleAccessory,
  randomize,
  reset,
  musicOn,
  onToggleMusic,
  volume,
  onVolumeChange,
  sfxOn,
  onToggleSfx,
  onPreview,
}) {
  const [tab, setTab] = useState('colors')
  const tabRefs = useRef({})

  const chooseColor = (key, value) => {
    update({ [key]: value })
    onPreview?.()
  }

  const chooseStyle = (maneStyle) => {
    update({ maneStyle })
    onPreview?.()
  }

  const chooseAccessory = (id) => {
    toggleAccessory(id)
    onPreview?.()
  }

  const onTabKeyDown = (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const index = TABS.findIndex((item) => item.id === tab)
    const nextIndex =
      event.key === 'ArrowRight'
        ? (index + 1) % TABS.length
        : (index - 1 + TABS.length) % TABS.length
    const next = TABS[nextIndex]
    setTab(next.id)
    tabRefs.current[next.id]?.focus()
  }

  return (
    <aside className="control-panel" aria-label="Estudio de personalización de Luna">
      <div className="panel__glow" aria-hidden="true" />
      <div className="panel__header">
        <div className="panel__emblem" aria-hidden="true">
          <Sparkles size={18} />
        </div>
        <div>
          <h2 className="panel__title">Estudio mágico</h2>
          <p className="panel__subtitle">Diseña el look de Luna</p>
        </div>
      </div>

      <div className="panel__tabs" role="tablist" aria-label="Secciones de personalización">
        {TABS.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[item.id] = node
              }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={active}
              aria-controls="panel-content"
              tabIndex={active ? 0 : -1}
              className={`panel-tab${active ? ' is-active' : ''}`}
              onClick={() => setTab(item.id)}
              onKeyDown={onTabKeyDown}
            >
              <Icon size={15} />
              {item.label}
            </button>
          )
        })}
      </div>

      <div
        className="panel__content"
        id="panel-content"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
      >
        {tab === 'colors' ? (
          <div className="panel__section">
            <SwatchRow
              label="Pelaje"
              colors={COAT_COLORS}
              value={config.coat}
              onChange={(value) => chooseColor('coat', value)}
            />
            <SwatchRow
              label="Melena"
              colors={MANE_COLORS}
              value={config.mane}
              onChange={(value) => chooseColor('mane', value)}
            />
            <SwatchRow
              label="Cola"
              colors={TAIL_COLORS}
              value={config.tail}
              onChange={(value) => chooseColor('tail', value)}
            />
            <SwatchRow
              label="Ojos"
              colors={EYE_COLORS}
              value={config.eye}
              onChange={(value) => chooseColor('eye', value)}
            />
          </div>
        ) : null}

        {tab === 'style' ? (
          <div className="panel__section">
            <div className="panel__group">
              <h3 className="panel__group-title">Forma de la melena</h3>
              <div className="style-list" role="group" aria-label="Estilo de melena">
                {MANE_STYLES.map((style) => {
                  const active = config.maneStyle === style.id
                  return (
                    <button
                      key={style.id}
                      type="button"
                      className={`style-card${active ? ' is-active' : ''}`}
                      aria-pressed={active}
                      onClick={() => chooseStyle(style.id)}
                    >
                      <span className={`style-card__mark style-card__mark--${style.id}`} />
                      <span className="style-card__text">
                        <strong>{style.label}</strong>
                        <small>{style.hint}</small>
                      </span>
                      {active ? <Check size={16} className="style-card__check" /> : null}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="panel__group">
              <h3 className="panel__group-title">Accesorios</h3>
              <div className="accessory-grid">
                {ACCESSORIES.map((accessory) => {
                  const Icon = ACCESSORY_ICONS[accessory.id]
                  const active = Boolean(config.accessories[accessory.id])
                  return (
                    <button
                      key={accessory.id}
                      type="button"
                      className={`accessory-chip${active ? ' is-active' : ''}`}
                      aria-pressed={active}
                      title={accessory.hint}
                      onClick={() => chooseAccessory(accessory.id)}
                    >
                      <Icon size={16} />
                      <span>{accessory.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'sound' ? (
          <div className="panel__section">
            <div className="sound-card">
              <span className="sound-card__icon">
                <Music2 size={18} />
              </span>
              <div className="sound-card__text">
                <strong>Música de ensueño</strong>
                <p>Una melodía generada en vivo con campanillas y sintetizadores.</p>
              </div>
              <Switch
                checked={musicOn}
                onChange={onToggleMusic}
                label="Música de ensueño"
              />
            </div>

            <div className="volume-control">
              <label className="volume-control__label" htmlFor="volume">
                Volumen
              </label>
              <div className="volume-control__row">
                <Volume2 size={17} />
                <input
                  id="volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(event) => onVolumeChange(Number(event.target.value))}
                />
                <span className="volume-control__value">{Math.round(volume * 100)}%</span>
              </div>
            </div>

            <div className="sound-row">
              <div>
                <strong>Efectos mágicos</strong>
                <small>Caricias, pasos y destellos</small>
              </div>
              <Switch checked={sfxOn} onChange={onToggleSfx} label="Efectos mágicos" />
            </div>

            <p className="sound-note">
              Consejo: la música comienza tras tu primera interacción. Puedes
              silenciarla en cualquier momento.
            </p>
          </div>
        ) : null}
      </div>

      <div className="panel__footer">
        <button type="button" className="btn btn--soft" onClick={randomize}>
          <Dices size={16} />
          Sorpréndeme
        </button>
        <button type="button" className="btn btn--ghost" onClick={reset}>
          <RotateCcw size={15} />
          Restablecer
        </button>
      </div>
    </aside>
  )
}
