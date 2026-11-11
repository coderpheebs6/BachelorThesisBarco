import { useState } from 'react'

export default function ModeSwitch() {
  const [advanced, setAdvanced] = useState(true)

  return (
    <div className="projection-mode">
      <button type="button" onClick={() => setAdvanced(false)} className={!advanced ? 'active' : ''}>
        Easy
      </button>
      <button type="button" onClick={() => setAdvanced(true)} className={advanced ? 'active' : ''}>
        Advanced
      </button>
    </div>
  )
}
