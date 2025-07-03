import { useQuery } from "@tanstack/react-query";

export function useInstallerAuth() {
  const { data: installerProfile, isLoading, error } = useQuery({
    queryKey: ["/api/installers/profile"],
    queryFn: async () => {
      const response = await fetch('/api/installers/profile', {
        credentials: 'include'
      });
      
      if (response.status === 401) {
        // Not authenticated - return null instead of throwing
        return null;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch installer profile');
      }
      
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    installerProfile,
    isInstallerAuthenticated: !!installerProfile && installerProfile.approvalStatus === 'approved',
    isLoading,
    error
  };
}