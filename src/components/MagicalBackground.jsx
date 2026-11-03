import { useMemo } from 'react'

const fract = (value) => value - Math.floor(value)
const seeded = (index, salt = 0) =>
  fract(Math.sin(index * 127.1 + salt * 311.7) * 43758.5453)

export default function MagicalBackground({ nightMode = false }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 54 }, (_, index) => ({
        left: seeded(index, 1) * 100,
        top: seeded(index, 2) * 82,
        size: 1.5 + seeded(index, 3) * 3.5,
        delay: seeded(index, 4) * 6,
        duration: 3 + seeded(index, 5) * 5,
        opacity: 0.3 + seeded(index, 6) * 0.6,
      })),
    [],
  )

  const sparkles = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) => ({
        left: 4 + seeded(index, 7) * 92,
        top: 8 + seeded(index, 8) * 78,
        delay: seeded(index, 9) * 8,
        duration: 7 + seeded(index, 10) * 8,
        scale: 0.5 + seeded(index, 11) * 1.1,
      })),
    [],
  )

  return (
    <div className={`magic-bg${nightMode ? ' is-night' : ''}`} aria-hidden="true">
      <div className="bg-gradient" />
      <div className="bg-aurora bg-aurora--pink" />
      <div className="bg-aurora bg-aurora--lilac" />
      <div className="bg-aurora bg-aurora--sky" />

      <div className="rainbow-deco">
        {['#ffc4e1', '#ffd9c7', '#fff2bb', '#cdf6e2', '#c6e7ff', '#dbc9ff'].map(
          (color, index) => (
            <span
              key={color}
              className="rainbow-deco__arc"
              style={{
                borderColor: color,
                inset: `${index * 14}px ${index * 14}px 0`,
              }}
            />
          ),
        )}
      </div>

      <div className="cloud cloud--one" />
      <div className="cloud cloud--two" />
      <div className="cloud cloud--three" />
      <div className="cloud cloud--four" />

      <div className="stars">
        {stars.map((star, index) => (
          <span
            key={index}
            className="star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      <div className="float-sparkles">
        {sparkles.map((sparkle, index) => (
          <span
            key={index}
            className="float-sparkle"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`,
              fontSize: `${12 * sparkle.scale}px`,
            }}
          >
            ✦
          </span>
        ))}
      </div>

      <div className="bg-haze" />
    </div>
  )
}
