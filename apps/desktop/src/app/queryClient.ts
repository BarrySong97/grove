/**
 * @purpose Creates the shared TanStack Query client for Rust-backed Grove data.
 * @role    App-level async state client used by feature hooks.
 * @deps    @tanstack/react-query
 * @gotcha  Rust/SQLite/git remain authoritative; query cache is configured as short-lived orchestration state.
 */
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: 'always',
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false
    },
    mutations: {
      retry: false
    }
  }
})
