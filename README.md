# Mi Mundo Mágico · Pony 3D

Una experiencia 3D interactiva con **Luna**, una pony alicornio. Diseña su look, acaríciala, pasea por el jardín y disfruta de una música generada en vivo.

## Tecnologías

- React 19 + Three.js (`@react-three/fiber`, `@react-three/drei`)
- Vite
- Audio procedural con WebAudio API (sin archivos de audio externos)
- Estilos en CSS puro con gradientes, glasmo y animaciones

## Instalación

```bash
npm install
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en `0.0.0.0:5173` |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Vista previa local del build |

## Características

- **Pony 3D animada:** estados idle, acariciar y pasear, con seguimiento del cursor, parpadeo natural y movimiento de orejas, alas y cola.
- **Personalización:** colores de pelaje, melena, cola y ojos; 3 estilos de melena (ondulada, flequillo, coleta); 5 accesorios (tiara, lazo, flor, collar, alas).
- **Audio:** música generada en tiempo real con sintetizadores y campanillas, más efectos de sonido para caricias, pasos y magia. Control de volumen y mute.
- **Jardín mágico:** flores, hierba, arbustos, setas, cristales, arcoíris, nubes flotantes y mariposas.
- **Responsive:** se adapta a móvil y escritorio, con controles táctiles y de ratón.
- **Accesibilidad:** etiquetas ARIA, reduced motion, soporte para teclado en pestañas y switches.
- **Persistencia:** tu look y preferencias de sonido se guardan en `localStorage`.

## Estructura del proyecto

```
src/
  main.jsx           # Punto de entrada
  App.jsx            # Componente principal y lógica de estado
  styles.css         # Estilos globales y responsive
  components/
    Scene.jsx        # Escena 3D (cámara, luces, partículas)
    Pony.jsx         # Modelo y animación de la pony
    Garden.jsx       # Jardín con flores, hierba, arbustos, etc.
    MagicalBackground.jsx  # Fondo decorativo con auroras, nubes y estrellas
    IntroOverlay.jsx # Pantalla de bienvenida
    ControlPanel.jsx # Panel de personalización (colores, estilo, sonido)
    ActionDock.jsx   # Dock de acciones (acariciar, pasear, música, vista)
    Switch.jsx       # Componente switch accesible
  hooks/
    usePonyConfig.js # Gestión de configuración y localStorage
    useEnvironment.js# Media queries, reduced motion, visibilidad
  audio/
    audioEngine.js   # Motor de audio procedural WebAudio
  data/
    palettes.js      # Colores, estilos, accesorios y configuración por defecto
```

## Despliegue

El comando `npm run build` genera una aplicación estática en `dist/` lista para subir a cualquier servicio de hosting estático (Vercel, Netlify, GitHub Pages, etc.).

### Vercel

1. Importa este repositorio en Vercel.
2. Usa `npm install` como comando de instalación.
3. Usa `npm run build` como comando de build.
4. Usa `dist` como directorio de salida.

No necesita variables de entorno ni backend: el audio se genera en el navegador y las preferencias se guardan localmente.

> Importante para Windows + WSL: `node_modules` contiene binarios nativos dependientes del sistema. No reutilices la carpeta instalada en Windows dentro de WSL. Si aparece `Cannot find native binding`, ejecuta en WSL:

```bash
rm -rf node_modules
npm ci --include=optional
npm run build
```

Si WSL responde `EIO` al borrar un archivo `.node` dentro de `/mnt/d`, la carpeta está bloqueada por Windows. Cierra VS Code, Vite y cualquier terminal que esté usando el proyecto; luego abre PowerShell y ejecuta:

```powershell
Set-Location D:\projects\pony
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -LiteralPath .\node_modules -Recurse -Force
```

Después vuelve a WSL y reinstala:

```bash
cd /mnt/d/projects/pony
npm ci --include=optional
npm run build
```

Para evitar este tipo de problemas de archivos nativos, la opción más estable es trabajar con el repositorio dentro del sistema de archivos Linux, por ejemplo `~/projects/pony`, en lugar de `/mnt/d`.

En un deploy limpio (Vercel, Netlify o CI) no hace falta este paso: el proveedor crea `node_modules` para su propio sistema operativo.

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`

## Créditos

Hecho con polvo de estrellas ✦
