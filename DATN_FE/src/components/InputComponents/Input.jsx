import React from 'react'
import { BiSearch } from 'react-icons/bi'

export default function Input({
  placeholder,
  className = '',
  id,
  register,
  name,
  type = 'text',
  autoComplete,
  errors,
  title,
  isSearch = false,
  defaultValue,
  isTextarea = false,
  isRequired = false
}) {
  return (
    <div className='w-full flex flex-col'>
      {title && (
        <label className='text-gray-400 lg:text-red-900 text-sm font-medium mb-1 dark:text-pink-300 text-left'>
          {title}
          {isRequired && <span className='text-red-500 ml-1'>*</span>}
        </label>
      )}
      <div className='flex items-center  rounded-lg border border-gray-300 dark:border-gray-600 h-full'>
        {isSearch && (
          <div className='px-2'>
            <BiSearch className='text-lg text-red-500' />
          </div>
        )}
        {isTextarea ? (
          <textarea
            id={id}
            defaultValue={defaultValue}
            autoComplete={autoComplete}
            placeholder={placeholder}
            {...register(name)}
            className={`w-full py-1 px-2 rounded-lg outline-none text-gray-800 dark:text-white dark:bg-gray-700 bg-white placeholder:text-gray-300 placeholder:dark:text-gray-500 ${className}`}
            rows={4}
          />
        ) : (
          <input
            id={id}
            defaultValue={defaultValue}
            autoComplete={autoComplete}
            type={type}
            placeholder={placeholder}
            {...register(name)}
            className={`w-full py-1 px-2 rounded-lg outline-none text-gray-800 dark:text-white dark:bg-gray-700 bg-white placeholder:text-gray-300 placeholder:dark:text-gray-500 ${className}`}
          />
        )}
      </div>
      {errors && <div className='mt-1 text-red-600 min-h-[1.25rem] text-xs'>{errors.message}</div>}
    </div>
  )
} 