import {
  QueryClient,
  QueryClientProvider as RQProvider,
} from "@tanstack/react-query";
import { useState } from "react";

export function QueryClientProvider({ children }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, staleTime: 30_000 },
        },
      })
  );
  return <RQProvider client={client}>{children}</RQProvider>;
}

export default QueryClientProvider;
