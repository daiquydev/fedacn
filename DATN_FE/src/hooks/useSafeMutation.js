import { useMutation } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'

/**
 * A wrapper around useMutation that prevents duplicate/spam calls.
 * When a mutation is already pending, subsequent mutate() calls are silently ignored.
 * 
 * @param {import('@tanstack/react-query').UseMutationOptions} options
 * @returns {import('@tanstack/react-query').UseMutationResult} - same API as useMutation
 */
export function useSafeMutation(options) {
  const mutation = useMutation(options)
  /** Khóa ngay trong cùng tick — `isPending` của React Query chỉ bật sau re-render nên double-click vẫn lọt nếu chỉ kiểm tra isPending */
  const inFlightRef = useRef(false)

  const safeMutate = useCallback(
    (variables, mutateOptions) => {
      if (inFlightRef.current) return
      inFlightRef.current = true
      mutation.mutate(variables, {
        ...mutateOptions,
        onSettled: (...args) => {
          inFlightRef.current = false
          mutateOptions?.onSettled?.(...args)
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutation.mutate]
  )

  const safeMutateAsync = useCallback(
    (variables, mutateOptions) => {
      if (inFlightRef.current) return Promise.resolve()
      inFlightRef.current = true
      return mutation.mutateAsync(variables, {
        ...mutateOptions,
        onSettled: (...args) => {
          inFlightRef.current = false
          mutateOptions?.onSettled?.(...args)
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutation.mutateAsync]
  )

  return {
    ...mutation,
    mutate: safeMutate,
    mutateAsync: safeMutateAsync
  }
}
