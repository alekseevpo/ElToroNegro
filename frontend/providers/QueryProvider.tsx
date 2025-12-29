'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Кэшировать данные на 15 минут
            staleTime: 15 * 60 * 1000, // 15 минут
            // Хранить данные в кэше 30 минут
            gcTime: 30 * 60 * 1000, // 30 минут (ранее cacheTime)
            // Повторять запросы при потере фокуса
            refetchOnWindowFocus: false,
            // Повторять запросы при переподключении
            refetchOnReconnect: true,
            // Не повторять запросы при монтировании
            refetchOnMount: false,
            // Повторять запросы при ошибках
            retry: 2,
            // Задержка между повторными попытками
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

