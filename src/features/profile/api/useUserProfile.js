import { useQuery } from "@tanstack/react-query";
import apiClient from "@shared/api/client";
import { queryKeys } from "@shared/api/queryKeys";

export function useUserProfile(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.profile.byId(userId),
    queryFn: async () => {
      if (!userId) return null;
      const res = await apiClient.get(`/api/auth/users/${userId}`);
      return res.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
    ...options,
  });
}

export default useUserProfile;
