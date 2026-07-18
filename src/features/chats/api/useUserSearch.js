import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@features/auth/api/authApi";
import { queryKeys } from "@shared/api/queryKeys";

const MIN_QUERY_LENGTH = 1;

export function useUserSearch(q, options = {}) {
  const query = (q ?? "").trim();
  const enabled = query.length >= MIN_QUERY_LENGTH;

  return useQuery({
    queryKey: queryKeys.users.search(query),
    queryFn: () => searchUsers(query),
    enabled,
    staleTime: 30_000,
    ...options,
  });
}

export default useUserSearch;
