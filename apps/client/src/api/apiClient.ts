import axios, { AxiosInstance } from 'axios';
import { ApiResponse, MissingPerson, FilterParams, Hotspot } from '@overwatch/shared';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get missing persons with filters
   */
  async getMissingPersons(filters: Partial<FilterParams>): Promise<ApiResponse> {
    const response = await this.client.get<ApiResponse>('/missing-persons', {
      params: filters,
    });
    return response.data;
  }

  /**
   * Get missing person by ID
   */
  async getMissingPerson(id: string): Promise<ApiResponse> {
    const response = await this.client.get<ApiResponse>(
      `/missing-persons/${id}`
    );
    return response.data;
  }

  /**
   * Find missing persons nearby a location
   */
  async getNearbyMissingPersons(
    longitude: number,
    latitude: number,
    radiusKm: number = 50
  ): Promise<ApiResponse> {
    const response = await this.client.get<ApiResponse>(
      '/missing-persons/nearby',
      {
        params: {
          longitude,
          latitude,
          radiusKm,
        },
      }
    );
    return response.data;
  }

  /**
   * Get hotspot analysis
   */
  async getHotspots(): Promise<ApiResponse> {
    const response = await this.client.get<ApiResponse>('/analytics/hotspots');
    return response.data;
  }

  /**
   * Get trend analysis
   */
  async getTrends(): Promise<ApiResponse> {
    const response = await this.client.get<ApiResponse>('/analytics/trends');
    return response.data;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<ApiResponse> {
    const response = await this.client.get<ApiResponse>(
      '/analytics/statistics'
    );
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
