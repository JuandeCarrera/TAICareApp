import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export function useRoutines({ userId } = {}) {
    return useQuery({
        queryKey: ['routines', { userId }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (userId) params.append('user_id', userId);

            const { data } = await api.get(`/routines?${params.toString()}`);
            return Array.isArray(data) ? data : [];
        },
        enabled: true,
    });
}

export function useCreateRoutine() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post('/routines', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] });
        },
    });
}

export function useUpdateRoutine() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }) => {
            const { data } = await api.put(`/routines/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] });
        },
    });
}

export function useDeleteRoutine() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            await api.delete(`/routines/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] });
        },
    });
}
