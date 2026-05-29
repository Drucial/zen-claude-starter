import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAppMutation } from "@/hooks/use-app-mutation";

const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("sonner", () => ({ toast }));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, invalidateSpy };
}

describe("useAppMutation", () => {
  it("fires a success toast and invalidates keys on success", async () => {
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(
      () =>
        useAppMutation({
          mutationFn: async (name: string) => `created ${name}`,
          successMessage: "User created",
          invalidates: [["users"]],
        }),
      { wrapper }
    );

    result.current.mutate("ada");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith("User created");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] });
  });

  it("fires an error toast with the error message on failure", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useAppMutation({
          mutationFn: async () => {
            throw new Error("boom");
          },
        }),
      { wrapper }
    );

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith("boom");
  });
});
