import { useQuery } from "@tanstack/react-query";
import { fetchUserChats } from "./chatApi";

// Ключ кэша
import { queryKeys } from "@shared/api/queryKeys";

export function useUserChats(options = {}) {
  return useQuery({
    queryKey: queryKeys.chats.all,
    queryFn: fetchUserChats,
    staleTime: 60_000, // 1 минута
    refetchInterval: 60_000,
    ...options,
  });
}

export default useUserChats;
