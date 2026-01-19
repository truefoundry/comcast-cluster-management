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
