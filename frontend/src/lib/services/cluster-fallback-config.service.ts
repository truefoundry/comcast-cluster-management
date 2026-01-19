import { apiClient } from "../api"
import type {
  ClusterFallbackConfig,
  CreateClusterFallbackConfigPayload,
  UpdateClusterFallbackConfigPayload,
} from "../types"

const BASE_URL = "/cluster-fallback-configs"

export const clusterFallbackConfigService = {
  /**
   * Get all cluster fallback configurations
   */
  getAll: async (): Promise<ClusterFallbackConfig[]> => {
    const response = await apiClient.get<ClusterFallbackConfig[]>(BASE_URL)
    return Array.isArray(response) ? response : []
  },

  /**
   * Get configurations by source cluster
   */
  getBySourceCluster: async (clusterId: string): Promise<ClusterFallbackConfig[]> => {
    const response = await apiClient.get<ClusterFallbackConfig[]>(
      `${BASE_URL}?sourceClusterId=${clusterId}`
    )
    return Array.isArray(response) ? response : []
  },

  /**
   * Get configurations by source workspace
   */
  getBySourceWorkspace: async (workspaceId: string): Promise<ClusterFallbackConfig[]> => {
    const response = await apiClient.get<ClusterFallbackConfig[]>(
      `${BASE_URL}?sourceWorkspaceId=${workspaceId}`
    )
    return Array.isArray(response) ? response : []
  },

  /**
   * Get a single configuration by ID
   */
  getById: async (id: string): Promise<ClusterFallbackConfig> => {
    return apiClient.get<ClusterFallbackConfig>(`${BASE_URL}/${id}`)
  },

  /**
   * Create a new cluster fallback configuration
   */
  create: async (
    payload: CreateClusterFallbackConfigPayload
  ): Promise<ClusterFallbackConfig> => {
    return apiClient.post<ClusterFallbackConfig>(BASE_URL, payload)
  },

  /**
   * Update an existing configuration
   */
  update: async (
    id: string,
    payload: UpdateClusterFallbackConfigPayload
  ): Promise<ClusterFallbackConfig> => {
    return apiClient.put<ClusterFallbackConfig>(`${BASE_URL}/${id}`, payload)
  },

  /**
   * Delete a configuration
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`)
  },
}
