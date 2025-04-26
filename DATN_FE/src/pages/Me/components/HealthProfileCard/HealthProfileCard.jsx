import React from 'react'

export default function HealthProfileCard({ title, items }) {
  return (
    <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg overflow-hidden">
      <div className="bg-red-700 text-white py-3 px-4">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="p-4">
        <ul className="space-y-4">
          {items.map((item, index) => (
            <li key={index} className="border-b border-gray-200 dark:border-gray-600 pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                <span className="font-medium text-gray-800 dark:text-white">{item.value}</span>
              </div>
              {item.description && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-300 text-right italic">
                  {item.description}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
} 