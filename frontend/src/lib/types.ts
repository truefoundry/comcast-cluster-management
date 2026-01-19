// API Response Types

export interface Cluster {
  id: string
  name: string
  fqn?: string
}

export interface Workspace {
  id: string
  name: string
  clusterId?: string
  fqn?: string
}

export interface ClusterInfo {
  clusterId: string
  workspaceId: string
}

export interface SourceClusterInfo extends ClusterInfo {
  jobId?: string
}

export interface ClusterFallbackConfig {
  id: string
  source: SourceClusterInfo
  destination: ClusterInfo
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

// Request Payloads
export interface CreateClusterFallbackConfigPayload {
  source: {
    clusterId: string
    workspaceId: string
    jobId?: string
  }
  destination: {
    clusterId: string
    workspaceId: string
  }
}

export interface UpdateClusterFallbackConfigPayload {
  source?: {
    clusterId: string
    workspaceId: string
    jobId?: string
  }
  destination?: {
    clusterId: string
    workspaceId: string
  }
}
