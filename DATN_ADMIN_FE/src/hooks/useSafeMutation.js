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
  const isPendingRef = useRef(false)

  // Sync ref with mutation state for instant access in closures
  isPendingRef.current = mutation.isPending

  const safeMutate = useCallback(
    (variables, mutateOptions) => {
      if (isPendingRef.current) return
      mutation.mutate(variables, mutateOptions)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutation.mutate]
  )

  const safeMutateAsync = useCallback(
    (variables, mutateOptions) => {
      if (isPendingRef.current) return Promise.resolve()
      return mutation.mutateAsync(variables, mutateOptions)
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
