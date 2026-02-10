import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export function useUsers(queryParams = {}) {
    return useQuery({
        queryKey: ['users', queryParams],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(queryParams).forEach(([k, v]) => {
                if (v !== undefined && v !== null) params.append(k, v);
            });

            const { data } = await api.get(`/users?${params.toString()}`);
            return Array.isArray(data) ? data : [];
        },
        enabled: true,
    });
}
