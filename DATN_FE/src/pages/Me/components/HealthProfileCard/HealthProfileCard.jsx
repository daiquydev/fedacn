import React from 'react'
import { motion } from 'framer-motion'
import { FaHeartPulse, FaWeightScale, FaPersonRunning } from 'react-icons/fa6'

// Icon mapping cho các loại card
const cardIcons = {
  'Thông tin cơ bản': <FaWeightScale className="mr-2" />,
  'Hoạt động & Mục tiêu': <FaPersonRunning className="mr-2" />,
  'Chỉ số sức khỏe': <FaHeartPulse className="mr-2" />
}

export default function HealthProfileCard({ title, items, iconColor }) {
  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  }

  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 h-full"
    >
      <div className={`p-4 ${iconColor ? iconColor : 'text-red-600'} flex items-center`}>
        {cardIcons[title] || <FaHeartPulse className="mr-2" />}
        <h3 className="text-lg font-semibold dark:text-white">{title}</h3>
      </div>
      
      <div className="p-4 divide-y divide-gray-100 dark:divide-gray-700">
        {items.map((item, index) => (
          <motion.div 
            key={index}
            variants={itemVariants}
            whileHover={{ x: 3 }}
            className={`py-3 ${index === 0 ? 'pt-0' : ''} ${index === items.length - 1 ? 'pb-0 border-b-0' : ''}`}
          >
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm">{item.label}</span>
              <span className={`font-medium ${item.highlighted ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
                {item.value}
              </span>
            </div>
            {item.description && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {item.description}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
} 