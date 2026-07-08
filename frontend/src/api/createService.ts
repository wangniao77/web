const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const MOCK_DELAY_MS = 200
const FETCH_TIMEOUT_MS = 8_000

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('request timeout')), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

export interface ServiceCallOptions<TArgs> {
  args?: TArgs
  mockDelay?: number
}

export interface CreateServiceOptions<TArgs, TResult> {
  mock: (args: TArgs) => TResult | Promise<TResult>
  fetch: (args: TArgs) => Promise<TResult>
  /** fetch 失败时是否回退 mock，默认 true */
  fallbackToMock?: boolean
}

export function createService<TArgs = void, TResult = unknown>(
  opts: CreateServiceOptions<TArgs, TResult>,
) {
  const fallbackToMock = opts.fallbackToMock !== false

  return async (args?: TArgs, options?: ServiceCallOptions<TArgs>): Promise<TResult> => {
    const resolvedArgs = (args ?? undefined) as TArgs
    const mockDelay = options?.mockDelay ?? MOCK_DELAY_MS

    if (useMock) {
      await delay(mockDelay)
      return opts.mock(resolvedArgs)
    }

    try {
      return await withTimeout(opts.fetch(resolvedArgs), FETCH_TIMEOUT_MS)
    } catch (error) {
      if (!fallbackToMock) throw error
      console.warn('[api] fetch failed, using mock fallback', error)
      return opts.mock(resolvedArgs)
    }
  }
}

export function isMockMode() {
  return useMock
}
