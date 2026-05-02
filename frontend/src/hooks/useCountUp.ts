import { useEffect, useState } from 'react'

/** Animates a number toward ``target`` for a short perceived-performance flourish. */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const from = 0
    let frame: number
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - t) * (1 - t)
      setValue(from + (target - from) * eased)
      if (t < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        setValue(target)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}
