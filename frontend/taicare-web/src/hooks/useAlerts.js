import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export function useAlerts({ userId, unread } = {}) {
  return useQuery({
    queryKey: ['alerts', { userId, unread }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (unread) params.append('unread', '1');

      const { data } = await api.get(`/alerts?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    },
    // Only skip when userId is explicitly null (patient panel, no patient selected)
    enabled: userId !== null,
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.put(`/alerts/${id}`, {
        read: true,
        seen: true,
        resolved: true,
        status: 'resolved',
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
