import { apiClient } from "../api"
import type { Cluster, Workspace } from "../types"

interface PaginatedResponse<T> {
  data: T[]
  pagination?: {
    total: number
    offset: number
    limit: number
  }
}

export const externalDataService = {
  /**
   * Get all clusters from TrueFoundry
   */
  getClusters: async (): Promise<Cluster[]> => {
    const response = await apiClient.get<PaginatedResponse<Cluster> | Cluster[]>("/clusters")
    // Handle both paginated and array responses
    if (Array.isArray(response)) {
      return response
    }
    return Array.isArray(response.data) ? response.data : []
  },

  /**
   * Get cluster by ID
   */
  getClusterById: async (id: string): Promise<Cluster> => {
    return apiClient.get<Cluster>(`/clusters/${id}`)
  },

  /**
   * Get all workspaces from TrueFoundry
   */
  getWorkspaces: async (clusterId?: string): Promise<Workspace[]> => {
    const url = clusterId ? `/workspaces?clusterId=${clusterId}` : "/workspaces"
    const response = await apiClient.get<PaginatedResponse<Workspace> | Workspace[]>(url)
    // Handle both paginated and array responses
    if (Array.isArray(response)) {
      return response
    }
    return Array.isArray(response.data) ? response.data : []
  },

  /**
   * Get workspace by ID
   */
  getWorkspaceById: async (id: string): Promise<Workspace> => {
    return apiClient.get<Workspace>(`/workspaces/${id}`)
  },
}
