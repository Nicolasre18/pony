export const COAT_COLORS = [
  { name: 'Rosa algodón', value: '#f6c7dd' },
  { name: 'Lila nube', value: '#e0d2ff' },
  { name: 'Celeste', value: '#cfe7ff' },
  { name: 'Vainilla', value: '#fff0c9' },
  { name: 'Menta', value: '#cef2e2' },
  { name: 'Coral', value: '#ffd2c4' },
  { name: 'Perla', value: '#fffaff' },
  { name: 'Malva', value: '#e7c4ee' },
]

export const MANE_COLORS = [
  { name: 'Lila estelar', value: '#b294ff' },
  { name: 'Rosa chicle', value: '#ff9fce' },
  { name: 'Cielo', value: '#8ed3ff' },
  { name: 'Dorado', value: '#ffd477' },
  { name: 'Coral', value: '#ffb096' },
  { name: 'Menta', value: '#98e8d1' },
  { name: 'Nieve', value: '#fff8ff' },
  { name: 'Violeta', value: '#e1a3ff' },
]

export const TAIL_COLORS = MANE_COLORS

export const EYE_COLORS = [
  { name: 'Amatista', value: '#7e5fc8' },
  { name: 'Zafiro', value: '#4f74cb' },
  { name: 'Esmeralda', value: '#3f9488' },
  { name: 'Frambuesa', value: '#b35384' },
  { name: 'Ámbar', value: '#a06e33' },
  { name: 'Chocolate', value: '#6f4b3c' },
]

export const MANE_STYLES = [
  {
    id: 'flow',
    label: 'Ondulada',
    hint: 'Melena larga y suave que flota con el viento.',
  },
  {
    id: 'bangs',
    label: 'Flequillo',
    hint: 'Un flequillo adorable con mechones cortos.',
  },
  {
    id: 'pony',
    label: 'Coleta',
    hint: 'Una coleta alta atada con una cinta de seda.',
  },
]

export const ACCESSORIES = [
  { id: 'tiara', label: 'Tiara', hint: 'Una corona de estrellas doradas.' },
  { id: 'bow', label: 'Lazo', hint: 'Un lazo de satén junto a la oreja.' },
  { id: 'flower', label: 'Flor', hint: 'Una florecita mágica en la melena.' },
  { id: 'necklace', label: 'Collar', hint: 'Estrellitas que brillan al moverse.' },
  { id: 'wings', label: 'Alas', hint: 'Alas de hada iridiscentes.' },
]

export const DEFAULT_CONFIG = {
  coat: '#f6c7dd',
  mane: '#b294ff',
  tail: '#b294ff',
  eye: '#7e5fc8',
  maneStyle: 'flow',
  accessories: {
    tiara: false,
    bow: true,
    flower: false,
    necklace: false,
    wings: true,
  },
}

const MANE_VALUES = MANE_COLORS.map((color) => color.value)
const COAT_VALUES = COAT_COLORS.map((color) => color.value)
const EYE_VALUES = EYE_COLORS.map((color) => color.value)
const STYLE_VALUES = MANE_STYLES.map((style) => style.id)
const ACCESSORY_KEYS = ACCESSORIES.map((accessory) => accessory.id)

const randomOf = (list) => list[Math.floor(Math.random() * list.length)]

export function sanitizeConfig(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_CONFIG
  const accessories = {}
  for (const key of ACCESSORY_KEYS) {
    accessories[key] =
      typeof raw.accessories?.[key] === 'boolean'
        ? raw.accessories[key]
        : DEFAULT_CONFIG.accessories[key]
  }
  return {
    coat: COAT_VALUES.includes(raw.coat) ? raw.coat : DEFAULT_CONFIG.coat,
    mane: MANE_VALUES.includes(raw.mane) ? raw.mane : DEFAULT_CONFIG.mane,
    tail: MANE_VALUES.includes(raw.tail) ? raw.tail : DEFAULT_CONFIG.tail,
    eye: EYE_VALUES.includes(raw.eye) ? raw.eye : DEFAULT_CONFIG.eye,
    maneStyle: STYLE_VALUES.includes(raw.maneStyle)
      ? raw.maneStyle
      : DEFAULT_CONFIG.maneStyle,
    accessories,
  }
}

export function randomConfig() {
  const coat = randomOf(COAT_VALUES)
  const mane = randomOf(MANE_VALUES)
  const accessories = {}
  for (const key of ACCESSORY_KEYS) {
    // Las alas y la tiara son las más especiales: aparecen con más frecuencia.
    const chance = key === 'wings' ? 0.72 : key === 'tiara' ? 0.35 : 0.28
    accessories[key] = key === 'wings' ? true : Math.random() < chance
  }
  return {
    coat,
    mane,
    tail: Math.random() < 0.65 ? mane : randomOf(MANE_VALUES),
    eye: randomOf(EYE_VALUES),
    maneStyle: randomOf(STYLE_VALUES),
    accessories,
  }
}
