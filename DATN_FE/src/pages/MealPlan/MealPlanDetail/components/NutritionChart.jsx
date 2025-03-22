import { useEffect, useRef } from 'react'

export default function NutritionChart({ protein, carbs, fat }) {
  const canvasRef = useRef(null)
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Calculate total calories and percentages
    const proteinCalories = protein * 4
    const carbsCalories = carbs * 4
    const fatCalories = fat * 9
    const totalCalories = proteinCalories + carbsCalories + fatCalories
    
    const proteinPercentage = Math.round((proteinCalories / totalCalories) * 100)
    const carbsPercentage = Math.round((carbsCalories / totalCalories) * 100)
    const fatPercentage = Math.round((fatCalories / totalCalories) * 100)
    
    // Draw pie chart
    const data = [
      { value: proteinPercentage, color: '#3b82f6', label: 'Protein' }, // Blue
      { value: carbsPercentage, color: '#f59e0b', label: 'Carbs' },     // Amber
      { value: fatPercentage, color: '#84cc16', label: 'Chất béo' }     // Lime
    ]
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Set canvas dimensions with higher resolution
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    
    // Calculate center and radius
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(centerX, centerY) - 40
    
    // Draw pie segments
    let startAngle = 0
    data.forEach(segment => {
      const segmentAngle = (segment.value / 100) * 2 * Math.PI
      
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + segmentAngle)
      ctx.closePath()
      
      ctx.fillStyle = segment.color
      ctx.fill()
      
      // Calculate text position
      const midAngle = startAngle + segmentAngle / 2
      const textRadius = radius * 0.7
      const textX = centerX + Math.cos(midAngle) * textRadius
      const textY = centerY + Math.sin(midAngle) * textRadius
      
      // Draw percentage text
      ctx.save()
      ctx.font = '16px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${segment.value}%`, textX, textY)
      ctx.restore()
      
      startAngle += segmentAngle
    })
    
    // Draw center circle (hole)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    
    // Draw legend
    const legendY = centerY + radius + 30
    data.forEach((segment, index) => {
      const legendX = centerX - radius + (index * (2 * radius / 3))
      
      // Draw color box
      ctx.fillStyle = segment.color
      ctx.fillRect(legendX, legendY, 15, 15)
      
      // Draw label
      ctx.font = '14px Arial'
      ctx.fillStyle = '#4b5563' // text-gray-600
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(segment.label, legendX + 20, legendY + 7.5)
    })
    
  }, [protein, carbs, fat])
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ maxHeight: '100%' }}
      />
    </div>
  )
} 