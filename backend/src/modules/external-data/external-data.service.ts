import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface Cluster {
  id: string;
  name: string;
  fqn?: string;
}

export interface Workspace {
  id: string;
  name: string;
  clusterId: string;
  fqn?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

interface TFPaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };
}

interface TFCluster {
  id: string;
  fqn: string;
  name: string;
  tenantName?: string;
}

interface TFWorkspace {
  id: string;
  fqn: string;
  name: string;
  clusterId: string;
  tenantName?: string;
}

interface TFUserInfo {
  id: string;
  name: string;
  email: string;
  tenantName?: string;
}

// Job Run types
export interface JobRun {
  id: string;
  name: string;
  applicationName: string;
  deploymentVersion: string;
  createdAt: number;
  endTime?: number;
  duration?: number;
  command?: string;
  totalRetries: number;
  error?: string;
  status: JobRunStatus;
  triggeredBy?: string;
  triggeredBySubject?: {
    subjectId: string;
    subjectType: string;
    subjectSlug: string;
    subjectDisplayName: string;
  };
  exitCode?: number;
  sparkUi?: string;
  applicationId: string;
  deploymentId: string;
}

export enum JobRunStatus {
  CREATED = 'CREATED',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Deployment types
export interface Deployment {
  id: string;
  applicationId: string;
  manifest: Record<string, unknown>;
  version?: string;
}

// Application creation types
export interface CreateApplicationRequest {
  manifest: Record<string, unknown>;
  dryRun?: boolean;
  forceDeploy?: boolean;
  triggerOnDeploy?: boolean;
}

export interface CreateApplicationResponse {
  application?: { id: string };
  deployment: { id: string; applicationId: string };
}

// Job trigger types
export interface TriggerJobRequest {
  applicationId: string;
  input?: Record<string, unknown>;
}

/**
 * External Data Service
 *
 * Fetches clusters and workspaces from TrueFoundry API.
 */
@Injectable()
export class ExternalDataService {
  private readonly baseUrl: string;
  private readonly httpClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'TRUEFOUNDRY_API_URL',
      'https://internal.devtest.truefoundry.tech',
    );

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });
  }

  /**
   * Get all clusters from TrueFoundry
   */
  async getClusters(
    authToken: string,
    limit = 100,
    offset = 0,
  ): Promise<{
    data: Cluster[];
    pagination: TFPaginatedResponse<TFCluster>['pagination'];
  }> {
    try {
      const response = await this.httpClient.get<
        TFPaginatedResponse<TFCluster>
      >('/api/svc/v1/clusters', {
        headers: { Authorization: authToken },
        params: { limit, offset },
      });

      return {
        data: response.data.data.map((cluster) => ({
          id: cluster.id,
          name: cluster.name,
          fqn: cluster.fqn,
        })),
        pagination: response.data.pagination,
      };
    } catch (error) {
      this.handleError(error, 'Failed to fetch clusters');
    }
  }

  /**
   * Get cluster by ID
   */
  async getClusterById(authToken: string, clusterId: string): Promise<Cluster> {
    try {
      const response = await this.httpClient.get<TFCluster>(
        `/api/svc/v1/clusters/${clusterId}`,
        {
          headers: { Authorization: authToken },
        },
      );

      return {
        id: response.data.id,
        name: response.data.name,
        fqn: response.data.fqn,
      };
    } catch (error) {
      this.handleError(error, `Failed to fetch cluster ${clusterId}`);
    }
  }

  /**
   * Get all workspaces from TrueFoundry
   */
  async getWorkspaces(
    authToken: string,
    options?: {
      limit?: number;
      offset?: number;
      clusterId?: string;
    },
  ): Promise<{
    data: Workspace[];
    pagination: TFPaginatedResponse<TFWorkspace>['pagination'];
  }> {
    try {
      const response = await this.httpClient.get<
        TFPaginatedResponse<TFWorkspace>
      >('/api/svc/v1/workspaces', {
        headers: { Authorization: authToken },
        params: {
          limit: options?.limit ?? 100,
          offset: options?.offset ?? 0,
          clusterId: options?.clusterId,
        },
      });

      return {
        data: response.data.data.map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
          clusterId: workspace.clusterId,
          fqn: workspace.fqn,
        })),
        pagination: response.data.pagination,
      };
    } catch (error) {
      this.handleError(error, 'Failed to fetch workspaces');
    }
  }

  /**
   * Get workspace by ID
   */
  async getWorkspaceById(
    authToken: string,
    workspaceId: string,
  ): Promise<Workspace> {
    try {
      const response = await this.httpClient.get<TFWorkspace>(
        `/api/svc/v1/workspaces/${workspaceId}`,
        {
          headers: { Authorization: authToken },
        },
      );

      return {
        id: response.data.id,
        name: response.data.name,
        clusterId: response.data.clusterId,
        fqn: response.data.fqn,
      };
    } catch (error) {
      this.handleError(error, `Failed to fetch workspace ${workspaceId}`);
    }
  }

  /**
   * Get current user info from TrueFoundry
   */
  async getUserInfo(authToken: string): Promise<UserInfo> {
    try {
      const response = await this.httpClient.get<TFUserInfo>(
        '/api/svc/v1/users/info',
        {
          headers: { Authorization: authToken },
        },
      );

      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
      };
    } catch (error) {
      this.handleError(error, 'Failed to fetch user info');
    }
  }

  /**
   * Get job runs by cluster and workspace from TrueFoundry Internal API
   */
  async getJobRunsByClusterAndWorkspace(
    authToken: string,
    clusterId: string,
    workspaceId: string,
    options?: {
      status?: JobRunStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<{
    data: JobRun[];
    pagination: { total: number; offset: number; limit: number };
  }> {
    try {
      const response = await this.httpClient.get<TFPaginatedResponse<JobRun>>(
        '/api/svc/v1/internal/job-runs',
        {
          headers: { Authorization: authToken },
          params: {
            clusterId,
            workspaceId,
            status: options?.status,
            limit: options?.limit ?? 100,
            offset: options?.offset ?? 0,
          },
        },
      );

      return {
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      this.handleError(
        error,
        `Failed to fetch job runs for cluster ${clusterId} and workspace ${workspaceId}`,
      );
    }
  }

  /**
   * Get deployment by application ID and version from TrueFoundry
   */
  async getDeployment(
    authToken: string,
    applicationId: string,
    deploymentVersion?: string,
  ): Promise<Deployment> {
    try {
      const params: Record<string, string> = {};
      if (deploymentVersion) {
        params.version = deploymentVersion;
      }

      const response = await this.httpClient.get<Deployment>(
        `/api/svc/v1/applications/${applicationId}/deployment`,
        {
          headers: { Authorization: authToken },
          params,
        },
      );

      return response.data;
    } catch (error) {
      this.handleError(
        error,
        `Failed to fetch deployment for application ${applicationId}`,
      );
    }
  }

  /**
   * Create an application on TrueFoundry
   */
  async createApplication(
    authToken: string,
    request: CreateApplicationRequest,
  ): Promise<CreateApplicationResponse> {
    try {
      const response = await this.httpClient.post<CreateApplicationResponse>(
        '/api/svc/v1/applications',
        request,
        {
          headers: { Authorization: authToken },
        },
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to create application');
    }
  }

  /**
   * Trigger a job on TrueFoundry
   */
  async triggerJob(
    authToken: string,
    request: TriggerJobRequest,
  ): Promise<{ jobRunId: string }> {
    try {
      const response = await this.httpClient.post<{ jobRunId: string }>(
        `/api/svc/v1/applications/${request.applicationId}/trigger`,
        { input: request.input },
        {
          headers: { Authorization: authToken },
        },
      );

      return response.data;
    } catch (error) {
      this.handleError(
        error,
        `Failed to trigger job for application ${request.applicationId}`,
      );
    }
  }

  /**
   * Terminate a job run on TrueFoundry
   */
  async terminateJobRun(
    authToken: string,
    deploymentId: string,
    jobRunName: string,
  ): Promise<void> {
    try {
      await this.httpClient.post(
        `/api/svc/v1/deployments/${deploymentId}/job-runs/${jobRunName}/terminate`,
        {},
        {
          headers: { Authorization: authToken },
        },
      );
    } catch (error) {
      this.handleError(
        error,
        `Failed to terminate job run ${jobRunName} for deployment ${deploymentId}`,
      );
    }
  }

  /**
   * Handle errors from TrueFoundry API
   */
  private handleError(error: unknown, message: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const responseData = error.response?.data as
        | { message?: string }
        | undefined;
      const errorMessage = responseData?.message || error.message || message;

      if (status === 401) {
        throw new HttpException(
          'Unauthorized - Invalid or expired token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      throw new HttpException(errorMessage, status);
    }

    throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
