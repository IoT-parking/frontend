import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface SensorReading {
    id: string;
    sensorType: string;
    sensorInstanceId: string;
    value: number;
    unit: string;
    timestamp: string;
}

// Nowy interfejs dla danych z Blockchaina
export interface SensorStatus {
    sensorId: string;
    wallet: string;
    tokens: number;
}

export interface PagedResponse<T> {
    data: T[];
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
}

export interface FilterParameters {
    sensorType?: string;
    sensorInstanceId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortDescending?: boolean;
    pageNumber?: number;
    pageSize?: number;
}

export const sensorApi = {
    getReadings: async (params: FilterParameters): Promise<PagedResponse<SensorReading>> => {
        const response = await api.get<PagedResponse<SensorReading>>('/sensors', { params });
        return response.data;
    },

    getReadingById: async (id: string): Promise<SensorReading> => {
        const response = await api.get<SensorReading>(`/sensors/${id}`);
        return response.data;
    },

    getSensorTypes: async (): Promise<string[]> => {
        const response = await api.get<string[]>('/sensors/sensor-types');
        return response.data;
    },

    getSensorInstances: async (sensorType?: string): Promise<string[]> => {
        const response = await api.get<string[]>('/sensors/sensor-instances', {
            params: sensorType ? { sensorType } : {},
        });
        return response.data;
    },

    getLastReadings: async (sensorInstanceId: string, count: number = 100): Promise<SensorReading[]> => {
        const response = await api.get<SensorReading[]>(`/sensors/last/${sensorInstanceId}`, {
            params: { count },
        });
        return response.data;
    },

    getAverage: async (sensorInstanceId: string, count: number = 100): Promise<{ sensorInstanceId: string; average: number; count: number }> => {
        const response = await api.get(`/sensors/average/${sensorInstanceId}`, {
            params: { count },
        });
        return response.data;
    },

    exportToCsv: async (params: FilterParameters): Promise<Blob> => {
        const response = await api.get('/sensors/export/csv', {
            params,
            responseType: 'blob',
        });
        return response.data;
    },

    exportToJson: async (params: FilterParameters): Promise<Blob> => {
        const response = await api.get('/sensors/export/json', {
            params,
            responseType: 'blob',
        });
        return response.data;
    },

    deleteAll: async (): Promise<void> => {
        await api.delete('/sensors/all');
    },

    getSensorRewardsStatus: async (): Promise<SensorStatus[]> => {
        const response = await api.get<SensorStatus[]>('/sensors/status');
        return response.data;
    }
};

export default api;