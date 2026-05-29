"use client";

import type {
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Message<TArg> = string | ((arg: TArg) => string);

type AppMutationOptions<TData, TError, TVariables, TContext> = Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  "onSuccess" | "onError"
> & {
  /** Toast shown on success. Omit for no success toast. */
  successMessage?: Message<TData>;
  /** Toast shown on error. Defaults to the error's message. */
  errorMessage?: Message<TError>;
  /** Query keys to invalidate after a successful mutation. */
  invalidates?: QueryKey[];
  onSuccess?: UseMutationOptions<
    TData,
    TError,
    TVariables,
    TContext
  >["onSuccess"];
  onError?: UseMutationOptions<TData, TError, TVariables, TContext>["onError"];
};

/**
 * useMutation with standardized success/error toasts and cache invalidation.
 * Per-model mutation hooks are only needed when a mutation requires logic
 * beyond toasts + invalidation.
 */
export function useAppMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: AppMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const queryClient = useQueryClient();
  const {
    successMessage,
    errorMessage,
    invalidates,
    onSuccess,
    onError,
    ...rest
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...rest,
    onSuccess: async (...args) => {
      const [data] = args;
      if (successMessage) {
        toast.success(
          typeof successMessage === "function"
            ? successMessage(data)
            : successMessage
        );
      }
      if (invalidates?.length) {
        await Promise.all(
          invalidates.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey })
          )
        );
      }
      await onSuccess?.(...args);
    },
    onError: (...args) => {
      const [error] = args;
      toast.error(
        errorMessage
          ? typeof errorMessage === "function"
            ? errorMessage(error)
            : errorMessage
          : error instanceof Error
            ? error.message
            : "Something went wrong"
      );
      onError?.(...args);
    },
  });
}
