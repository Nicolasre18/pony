import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = process.env.APP_URL || 'http://localhost:5173'
const OUT = process.env.OUT_DIR || 'shots'

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--hide-scrollbars',
  ],
})

const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
})

const logs = []
page.on('console', (message) => logs.push(`[${message.type()}] ${message.text()}`))
page.on('pageerror', (error) => logs.push(`[pageerror] ${error.message}`))
page.on('requestfailed', (request) => logs.push(`[requestfailed] ${request.url()} ${request.failure()?.errorText}`))

for (let attempt = 0; attempt < 20; attempt += 1) {
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 8000 })
    break
  } catch (error) {
    if (attempt === 19) throw error
    await page.waitForTimeout(600)
  }
}

await page.waitForTimeout(1400)
await page.screenshot({ path: `${OUT}/01-intro-desktop.png` })

const enter = page.getByRole('button', { name: /Entrar en la magia/i })
if (await enter.count()) {
  await enter.click()
}
await page.waitForTimeout(2600)
await page.screenshot({ path: `${OUT}/02-desktop.png` })

const webgl = await page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  if (!canvas) return { canvas: false }
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  return {
    canvas: true,
    width: canvas.width,
    height: canvas.height,
    gl: Boolean(gl),
    renderer: gl ? gl.getParameter(gl.RENDERER) : null,
  }
})

// Acariciar
await page.getByRole('button', { name: /Acariciar a Luna/i }).click()
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/03-pet-desktop.png` })
await page.waitForTimeout(2400)

// Pestaña estilo
await page.getByRole('tab', { name: /Estilo/i }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/04-style-desktop.png` })

// Pestaña sonido
await page.getByRole('tab', { name: /Sonido/i }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/05-sound-desktop.png` })

// Móvil
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
})
mobile.on('console', (message) => logs.push(`[mobile ${message.type()}] ${message.text()}`))
mobile.on('pageerror', (error) => logs.push(`[mobile pageerror] ${error.message}`))
await mobile.goto(URL, { waitUntil: 'networkidle', timeout: 20000 })
await mobile.waitForTimeout(1200)
await mobile.screenshot({ path: `${OUT}/06-intro-mobile.png`, timeout: 120000 })
const enterMobile = mobile.getByRole('button', { name: /Entrar en la magia/i })
if (await enterMobile.count()) await enterMobile.click()
await mobile.waitForTimeout(2600)
await mobile.screenshot({ path: `${OUT}/07-mobile.png`, timeout: 120000 })
await mobile.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await mobile.waitForTimeout(900)
await mobile.screenshot({ path: `${OUT}/08-mobile-panel.png`, timeout: 120000 })

console.log(JSON.stringify({ webgl, logs }, null, 2))
await browser.close()
