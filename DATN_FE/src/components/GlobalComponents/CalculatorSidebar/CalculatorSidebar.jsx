/**
 * CalculatorSidebar – Reusable modern sidebar for all calculator pages.
 * Wraps the form on the right side with a consistent modern card UI.
 * Usage: <CalculatorSidebar title="Tính toán BMI" subtitle="(Theo hệ kilogram và mét)" gradient="from-orange-500 to-amber-400">
 *   {form fields}
 * </CalculatorSidebar>
 */
export default function CalculatorSidebar({ title, subtitle, gradient = 'from-blue-600 to-purple-600', children, result, onAIClick }) {
    return (
        <div className='top-4 space-y-4'>
            {/* Form card */}
            <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700'>
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${gradient} px-5 py-4`}>
                    <h3 className='text-white font-bold text-base leading-tight'>{title}</h3>
                    {subtitle && <p className='text-white/70 text-xs mt-0.5'>{subtitle}</p>}
                </div>

                {/* Form body */}
                <div className='p-5'>
                    {children}
                </div>
            </div>

            {/* Result card */}
            {result && (
                <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg`}>
                    <p className='text-white/70 text-xs font-medium mb-1'>Kết quả tính toán</p>
                    <p className='text-2xl font-bold'>{result.value} <span className='text-base font-normal text-white/80'>{result.unit}</span></p>
                    {result.label && <p className='text-white/80 text-xs mt-1'>{result.label}</p>}
                    {onAIClick && (
                        <button
                            onClick={onAIClick}
                            className='mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-semibold rounded-xl transition-all duration-200'
                        >
                            🤖 AI Phân tích chỉ số
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
