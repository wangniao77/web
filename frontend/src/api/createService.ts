const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const MOCK_DELAY_MS = 200

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export interface ServiceCallOptions<TArgs> {
  args?: TArgs
  mockDelay?: number
}

export interface CreateServiceOptions<TArgs, TResult> {
  mock: (args: TArgs) => TResult | Promise<TResult>
  fetch: (args: TArgs) => Promise<TResult>
}

export function createService<TArgs = void, TResult = unknown>(
  opts: CreateServiceOptions<TArgs, TResult>,
) {
  return async (args?: TArgs, options?: ServiceCallOptions<TArgs>): Promise<TResult> => {
    const resolvedArgs = (args ?? undefined) as TArgs
    const mockDelay = options?.mockDelay ?? MOCK_DELAY_MS

    if (useMock) {
      await delay(mockDelay)
      return opts.mock(resolvedArgs)
    }

    return opts.fetch(resolvedArgs)
  }
}

export function isMockMode() {
  return useMock
}
