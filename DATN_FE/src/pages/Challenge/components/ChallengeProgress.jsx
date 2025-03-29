export default function ChallengeProgress({ currentValue, targetValue, targetUnit, progress }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Tiến độ: {currentValue}/{targetValue} {targetUnit}
        </span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {progress}%
        </span>
      </div>
      
      <div className="relative pt-6 pb-4">
        {[25, 50, 75].map(milestone => (
          <div
            key={milestone}
            className="absolute top-0 -mt-1 text-xs"
            style={{ left: `${milestone}%`, transform: 'translateX(-50%)' }}
          >
            <span className="text-gray-500 dark:text-gray-400">
              {milestone}%
            </span>
          </div>
        ))}
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-1">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {[25, 50, 75].map(milestone => (
          <div
            key={milestone}
            className={`absolute bottom-0 w-0.5 h-3 ${
              progress >= milestone ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            style={{ left: `${milestone}%` }}
          />
        ))}
      </div>
    </div>
  );
} 