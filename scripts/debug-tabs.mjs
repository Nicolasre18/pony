import { chromium } from 'playwright-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

// 1) Control: plain page with the same CSS, no WebGL.
const plain = await browser.newPage()
await plain.setContent(`
  <style>
    .t { background: transparent; transition: background 0.2s ease; }
    .t.on { background: #fff; }
  </style>
  <button class="t on" id="a">A</button>
  <button class="t" id="b">B</button>
`)
await plain.evaluate(() => {
  document.getElementById('a').classList.remove('on')
  document.getElementById('b').classList.add('on')
})
await plain.waitForTimeout(400)
console.log(
  'control:',
  await plain.evaluate(() => ['a', 'b'].map((id) => getComputedStyle(document.getElementById(id)).backgroundColor)),
)

// 2) Real page, longer wait.
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /Entrar en la magia/i }).click()
await page.waitForTimeout(1500)
await page.getByRole('tab', { name: /Estilo/i }).click()
await page.waitForTimeout(2500)
console.log(
  'real +2.5s:',
  await page.evaluate(() =>
    [...document.querySelectorAll('[role="tab"]')].map((el) => [
      el.textContent.trim(),
      getComputedStyle(el).backgroundColor,
    ]),
  ),
)
console.log('frames:', await page.evaluate(() => new Promise((resolve) => {
  let count = 0
  const start = performance.now()
  const tick = () => {
    count += 1
    if (performance.now() - start > 1000) resolve(count)
    else requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})))

await browser.close()
