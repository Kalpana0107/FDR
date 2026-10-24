import React from 'react'
import { Sparkles } from 'lucide-react'

export default function SimulatedChip({ text = 'Simulated', className = '' }) {
  return (
    <span className={`chip-simulated gap-1 ${className}`}>
      <Sparkles size={11} className="text-warn-700" />
      <span>{text}</span>
    </span>
  )
}
