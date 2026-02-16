import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export function useHouseholds() {
  return useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const { data } = await api.get('/households');
      // Normaliza rooms para evitar errores
      return (Array.isArray(data) ? data : []).map((h) => ({
        ...h,
        rooms: Array.isArray(h?.rooms) ? h.rooms.filter(Boolean) : [],
      }));
    },
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/households', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}

export function useUpdateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/households/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}

export function useDeleteHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/households/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}

export function useAddRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, room }) => {
      const { data } = await api.put(`/households/${id}/rooms`, { room });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}
