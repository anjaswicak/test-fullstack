"use client"
import { useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

export default function ParticlesBackground() {
  const [init, setInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setInit(true))
  }, [])

  const options = useMemo(
    () => ({
      background: { color: '#000' },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'repulse' },
          onClick: { enable: true, mode: 'push' },
          resize: { enable: true }
        },
        modes: {
          repulse: { distance: 50, duration: 0.04 },
          push: { quantity: 4 }
        }
      },
      particles: {
        color: { value: '#07e2ffff' },
        links: { color: '#07e2ffff', distance: 150, enable: true, opacity: 0.3, width: 2 },
  collisions: { enable: false },
  move: { direction: 'none', enable: true, outModes: { default: 'bounce' }, random: false, speed: 1, straight: false },
        number: { density: { enable: true, area: 800 }, value: 200 },
        opacity: { value: 0.3 },
        shape: { type: 'circle' },
        size: { value: 5 }
      },
      detectRetina: true
    }),
    []
  )

  if (!init) return null

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Particles id="tsparticles" options={options} />
    </div>
  )
}
