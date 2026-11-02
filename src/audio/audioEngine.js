/**
 * Motor de audio procedural.
 * La música y los efectos se sintetizan en vivo con WebAudio: no hay
 * archivos externos, así la experiencia funciona sin conexión y pesa poco.
 */

const CHORDS = [
  [60, 64, 67, 71], // Do mayor 7
  [57, 60, 64, 67], // La menor 7
  [53, 57, 60, 65], // Fa mayor 7
  [55, 59, 62, 67], // Sol mayor 7
]

const ARP_PATTERN = [0, 2, 1, 3, 2, 0, 3, 1]
const STEP_DURATION = 0.3
const STEPS_PER_CHORD = 24

const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12)
const clamp01 = (value) => Math.min(1, Math.max(0, value))

class MagicAudio {
  constructor() {
    this.ctx = null
    this.master = null
    this.musicBus = null
    this.sfxBus = null
    this.reverbSend = null
    this.noiseBuffer = null
    this.musicOn = false
    this.sfxOn = true
    this.volume = 0.6
    this.timer = null
    this.nextTime = 0
    this.step = 0
    this.active = new Set()
    this.stopTimer = null
    this.hidden = false
  }

  async ensure() {
    if (typeof window === 'undefined') return null
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        try {
          await this.ctx.resume()
        } catch {
          /* el navegador decidirá */
        }
      }
      return this.ctx
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioCtor) return null

    this.ctx = new AudioCtor()

    this.master = this.ctx.createGain()
    this.master.gain.value = this.masterLevel()

    const compressor = this.ctx.createDynamicsCompressor()
    compressor.threshold.value = -18
    compressor.knee.value = 22
    compressor.ratio.value = 4
    compressor.attack.value = 0.01
    compressor.release.value = 0.3

    this.master.connect(compressor)
    compressor.connect(this.ctx.destination)

    this.musicBus = this.ctx.createGain()
    this.musicBus.gain.value = 1
    this.musicBus.connect(this.master)

    this.sfxBus = this.ctx.createGain()
    this.sfxBus.gain.value = 0.9
    this.sfxBus.connect(this.master)

    const convolver = this.ctx.createConvolver()
    convolver.buffer = this.createReverbImpulse(2.8)
    const wet = this.ctx.createGain()
    wet.gain.value = 0.42
    convolver.connect(wet)
    wet.connect(this.master)

    this.reverbSend = this.ctx.createGain()
    this.reverbSend.gain.value = 0.5
    this.reverbSend.connect(convolver)

    this.noiseBuffer = this.createNoiseBuffer(1.2)

    document.addEventListener('visibilitychange', () => {
      this.hidden = document.hidden
      if (!this.ctx) return
      if (document.hidden) {
        this.ctx.suspend().catch(() => {})
      } else {
        this.ctx.resume().catch(() => {})
        this.nextTime = this.ctx.currentTime + 0.25
      }
    })

    return this.ctx
  }

  createReverbImpulse(seconds) {
    const rate = this.ctx.sampleRate
    const length = Math.floor(rate * seconds)
    const buffer = this.ctx.createBuffer(2, length, rate)
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < length; i += 1) {
        const decay = Math.pow(1 - i / length, 2.6)
        data[i] = (Math.random() * 2 - 1) * decay
      }
    }
    return buffer
  }

  createNoiseBuffer(seconds) {
    const rate = this.ctx.sampleRate
    const length = Math.floor(rate * seconds)
    const buffer = this.ctx.createBuffer(1, length, rate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1
    }
    return buffer
  }

  masterLevel() {
    return Math.pow(clamp01(this.volume), 1.5) * 0.95
  }

  async setVolume(value) {
    this.volume = clamp01(value)
    if (!this.ctx) return
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setTargetAtTime(this.masterLevel(), now, 0.06)
  }

  setSfxEnabled(enabled) {
    this.sfxOn = Boolean(enabled)
  }

  async setMusicEnabled(enabled) {
    if (enabled) {
      await this.startMusic()
    } else {
      this.stopMusic()
    }
  }

  async startMusic() {
    const ctx = await this.ensure()
    if (!ctx) return
    this.musicOn = true
    if (this.stopTimer) {
      window.clearTimeout(this.stopTimer)
      this.stopTimer = null
    }
    const now = ctx.currentTime
    this.musicBus.gain.cancelScheduledValues(now)
    this.musicBus.gain.setTargetAtTime(1, now, 0.4)
    if (this.timer) return

    this.nextTime = now + 0.25
    this.step = 0
    this.timer = window.setInterval(() => this.tick(), 180)
  }

  stopMusic() {
    this.musicOn = false
    if (!this.ctx) return
    if (this.timer) {
      window.clearInterval(this.timer)
      this.timer = null
    }
    const now = this.ctx.currentTime
    this.musicBus.gain.cancelScheduledValues(now)
    this.musicBus.gain.setTargetAtTime(0.0001, now, 0.25)
    if (this.stopTimer) window.clearTimeout(this.stopTimer)
    this.stopTimer = window.setTimeout(() => {
      for (const node of this.active) {
        try {
          node.stop()
        } catch {
          /* el nodo ya terminó */
        }
      }
      this.active.clear()
      this.stopTimer = null
    }, 900)
  }

  tick() {
    if (!this.ctx || !this.musicOn || this.hidden || this.ctx.state !== 'running') return
    const ctx = this.ctx
    if (this.nextTime < ctx.currentTime - 0.5) {
      this.nextTime = ctx.currentTime + 0.1
    }
    while (this.nextTime < ctx.currentTime + 0.9) {
      const chord = CHORDS[Math.floor(this.step / STEPS_PER_CHORD) % CHORDS.length]
      if (this.step % STEPS_PER_CHORD === 0) {
        this.schedulePad(chord, this.nextTime, 9.6)
      }
      const chordIndex = Math.floor(this.step / STEPS_PER_CHORD) % CHORDS.length
      const pattern = ARP_PATTERN[this.step % ARP_PATTERN.length]
      const note = CHORDS[chordIndex][pattern]
      const octave = this.step % (ARP_PATTERN.length * 2) < ARP_PATTERN.length ? 12 : 24
      this.scheduleBell(note + octave, this.nextTime, 0.052, 1.8)

      if (this.step % 8 === 4) {
        const sparkleNote = CHORDS[(chordIndex + 2) % CHORDS.length][2] + 36
        this.scheduleBell(sparkleNote, this.nextTime + 0.14, 0.022, 2.6)
      }
      this.step += 1
      this.nextTime += STEP_DURATION
    }
  }

  makeVoice(source, destination) {
    source.connect(destination)
    this.active.add(source)
    source.onended = () => this.active.delete(source)
  }

  schedulePad(chord, at, duration) {
    const ctx = this.ctx
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1350
    filter.Q.value = 0.4

    const envelope = ctx.createGain()
    envelope.gain.setValueAtTime(0.0001, at)
    envelope.gain.linearRampToValueAtTime(0.055, at + 2.4)
    envelope.gain.setValueAtTime(0.055, at + duration - 3.2)
    envelope.gain.linearRampToValueAtTime(0.0001, at + duration)

    filter.connect(envelope)
    envelope.connect(this.musicBus)
    envelope.connect(this.reverbSend)

    for (const note of chord) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = midiToFreq(note)
      osc.detune.value = (Math.random() - 0.5) * 8
      osc.connect(filter)
      osc.start(at)
      osc.stop(at + duration + 0.1)
      this.makeVoice(osc, filter)
    }

    // Una nota grave muy suave sostiene la armonía.
    const bass = ctx.createOscillator()
    bass.type = 'triangle'
    bass.frequency.value = midiToFreq(chord[0] - 12)
    const bassGain = ctx.createGain()
    bassGain.gain.setValueAtTime(0.0001, at)
    bassGain.gain.linearRampToValueAtTime(0.045, at + 2.8)
    bassGain.gain.linearRampToValueAtTime(0.0001, at + duration)
    bass.connect(bassGain)
    bassGain.connect(this.musicBus)
    bass.start(at)
    bass.stop(at + duration + 0.1)
    this.makeVoice(bass, bassGain)
  }

  scheduleBell(midi, at, volume = 0.05, decay = 2) {
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = midiToFreq(midi)

    const shimmer = ctx.createOscillator()
    shimmer.type = 'triangle'
    shimmer.frequency.value = midiToFreq(midi + 12)
    shimmer.detune.value = 4

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay)

    const shimmerGain = ctx.createGain()
    shimmerGain.gain.setValueAtTime(0.0001, at)
    shimmerGain.gain.exponentialRampToValueAtTime(volume * 0.3, at + 0.02)
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, at + decay * 0.8)

    osc.connect(gain)
    shimmer.connect(shimmerGain)
    gain.connect(this.musicBus)
    gain.connect(this.reverbSend)
    shimmerGain.connect(this.musicBus)
    shimmerGain.connect(this.reverbSend)

    osc.start(at)
    shimmer.start(at)
    osc.stop(at + decay + 0.1)
    shimmer.stop(at + decay)
    this.makeVoice(osc, gain)
    this.makeVoice(shimmer, shimmerGain)
  }

  async playPet() {
    const ctx = await this.ensure()
    if (!ctx || !this.sfxOn) return
    const now = ctx.currentTime + 0.02
    const notes = [84, 88, 91, 96]
    notes.forEach((midi, i) => {
      this.scheduleSfxBell(midi, now + i * 0.08, 0.14, 1.4)
    })
    this.playSparkle(now + 0.05)
  }

  async playPaint() {
    const ctx = await this.ensure()
    if (!ctx || !this.sfxOn) return
    const now = ctx.currentTime + 0.01
    this.scheduleSfxBell(88, now, 0.075, 0.55)
    this.scheduleSfxBell(91, now + 0.06, 0.05, 0.5)
  }

  async playWalkStep() {
    const ctx = await this.ensure()
    if (!ctx || !this.sfxOn) return
    const now = ctx.currentTime + 0.01
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(190, now)
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.12)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
    osc.connect(gain)
    gain.connect(this.sfxBus)
    osc.start(now)
    osc.stop(now + 0.2)
  }

  scheduleSfxBell(midi, at, volume, decay) {
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = midiToFreq(midi)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay)
    osc.connect(gain)
    gain.connect(this.sfxBus)
    gain.connect(this.reverbSend)
    osc.start(at)
    osc.stop(at + decay + 0.05)
  }

  playSparkle(at = this.ctx.currentTime) {
    const ctx = this.ctx
    const source = ctx.createBufferSource()
    source.buffer = this.noiseBuffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 5500
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.035, at + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxBus)
    gain.connect(this.reverbSend)
    source.start(at)
    source.stop(at + 1)
  }

  async playMagic() {
    const ctx = await this.ensure()
    if (!ctx || !this.sfxOn) return
    const now = ctx.currentTime + 0.02
    this.playSparkle(now)
    ;[79, 84, 88].forEach((midi, i) => {
      this.scheduleSfxBell(midi, now + i * 0.06, 0.06, 1.2)
    })
  }

  async playChime() {
    const ctx = await this.ensure()
    if (!ctx || !this.sfxOn) return
    const now = ctx.currentTime + 0.02
    ;[84, 91].forEach((midi, i) => {
      this.scheduleSfxBell(midi, now + i * 0.09, 0.05, 1.1)
    })
  }

  dispose() {
    this.stopMusic()
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }
}

export const audio = new MagicAudio()
