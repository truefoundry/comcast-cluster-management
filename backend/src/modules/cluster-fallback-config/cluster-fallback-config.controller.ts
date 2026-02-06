import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClusterFallbackConfigService,
  ClusterFallbackConfigResponse,
} from './cluster-fallback-config.service';
import {
  CreateClusterFallbackConfigDto,
  UpdateClusterFallbackConfigDto,
} from './dto';
import { ExternalDataService } from '../external-data';

@Controller('api/cluster-fallback-configs')
export class ClusterFallbackConfigController {
  constructor(
    private readonly configService: ClusterFallbackConfigService,
    private readonly externalDataService: ExternalDataService,
    private readonly appConfigService: ConfigService,
  ) {}

  /**
   * Get auth token from header or fallback to env var
   */
  private getAuthToken(authHeader?: string): string | undefined {
    if (authHeader) {
      return authHeader;
    }
    const fallbackToken =
      this.appConfigService.get<string>('TF_USER_API_TOKEN');
    if (fallbackToken) {
      return `Bearer ${fallbackToken}`;
    }
    return undefined;
  }

  /**
   * Require auth token - throws UnauthorizedException if not present
   */
  private requireAuthToken(authHeader?: string): string {
    const authToken = this.getAuthToken(authHeader);
    if (!authToken) {
      throw new UnauthorizedException('Authentication required');
    }
    return authToken;
  }

  /**
   * Get user ID from auth token
   */
  private async getUserId(authHeader?: string): Promise<string | undefined> {
    const authToken = this.getAuthToken(authHeader);
    if (!authToken) {
      return undefined;
    }

    try {
      const userInfo = await this.externalDataService.getUserInfo(authToken);
      return userInfo.id;
    } catch {
      // If we can't get user info, continue without it
      return undefined;
    }
  }

  /**
   * Create a new cluster fallback configuration (with access check)
   */
  @Post()
  async create(
    @Headers('authorization') authHeader: string,
    @Body() createDto: CreateClusterFallbackConfigDto,
  ): Promise<ClusterFallbackConfigResponse> {
    const authToken = this.requireAuthToken(authHeader);

    const { clusterIds, workspaceIds } =
      await this.getUserAccessibleResources(authToken);

    // Check access to source cluster/workspace
    const hasSourceAccess =
      clusterIds.has(createDto.source.clusterId) &&
      workspaceIds.has(createDto.source.workspaceId);

    if (!hasSourceAccess) {
      throw new ForbiddenException(
        'You do not have access to the specified source cluster/workspace',
      );
    }

    // Check access to destination cluster/workspace
    const hasDestinationAccess =
      clusterIds.has(createDto.destination.clusterId) &&
      workspaceIds.has(createDto.destination.workspaceId);

    if (!hasDestinationAccess) {
      throw new ForbiddenException(
        'You do not have access to the specified destination cluster/workspace',
      );
    }

    const userId = await this.getUserId(authHeader);
    return this.configService.create(createDto, userId);
  }

  /**
   * Get user's accessible cluster and workspace IDs
   * Derives cluster IDs from workspaces since frontend now uses workspace.clusterId
   */
  private async getUserAccessibleResources(
    authToken: string,
  ): Promise<{ clusterIds: Set<string>; workspaceIds: Set<string> }> {
    const workspacesResponse =
      await this.externalDataService.getWorkspaces(authToken);

    return {
      clusterIds: new Set(workspacesResponse.data.map((w) => w.clusterId)),
      workspaceIds: new Set(workspacesResponse.data.map((w) => w.id)),
    };
  }

  /**
   * Check if user has access to a config (both source and destination)
   */
  private hasAccessToConfig(
    config: ClusterFallbackConfigResponse,
    accessibleClusterIds: Set<string>,
    accessibleWorkspaceIds: Set<string>,
  ): boolean {
    const hasSourceAccess =
      accessibleClusterIds.has(config.source.clusterId) &&
      accessibleWorkspaceIds.has(config.source.workspaceId);

    const hasDestinationAccess =
      accessibleClusterIds.has(config.destination.clusterId) &&
      accessibleWorkspaceIds.has(config.destination.workspaceId);

    return hasSourceAccess && hasDestinationAccess;
  }

  /**
   * Get all configurations (filtered by user access)
   *
   * Query params:
   * - sourceClusterId: Filter by source cluster
   * - sourceWorkspaceId: Filter by source workspace
   */
  @Get()
  async findAll(
    @Headers('authorization') authHeader: string,
    @Query('sourceClusterId') sourceClusterId?: string,
    @Query('sourceWorkspaceId') sourceWorkspaceId?: string,
  ): Promise<ClusterFallbackConfigResponse[]> {
    const authToken = this.requireAuthToken(authHeader);

    // Fetch user's accessible clusters and workspaces in parallel
    const { clusterIds, workspaceIds } =
      await this.getUserAccessibleResources(authToken);

    // Get filtered configs based on user access
    let configs = await this.configService.findAllForUser(
      clusterIds,
      workspaceIds,
    );

    // Apply additional query filters if provided
    if (sourceClusterId) {
      configs = configs.filter((c) => c.source.clusterId === sourceClusterId);
    }
    if (sourceWorkspaceId) {
      configs = configs.filter(
        (c) => c.source.workspaceId === sourceWorkspaceId,
      );
    }

    return configs;
  }

  /**
   * Get configuration by ID (with access check)
   */
  @Get(':id')
  async findOne(
    @Headers('authorization') authHeader: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClusterFallbackConfigResponse> {
    const authToken = this.requireAuthToken(authHeader);
    const config = await this.configService.findOne(id);

    const { clusterIds, workspaceIds } =
      await this.getUserAccessibleResources(authToken);

    if (!this.hasAccessToConfig(config, clusterIds, workspaceIds)) {
      throw new ForbiddenException(
        'You do not have access to this configuration',
      );
    }

    return config;
  }

  /**
   * Update a configuration (with access check)
   */
  @Put(':id')
  async update(
    @Headers('authorization') authHeader: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateClusterFallbackConfigDto,
  ): Promise<ClusterFallbackConfigResponse> {
    const authToken = this.requireAuthToken(authHeader);

    // First check access to the existing config
    const existingConfig = await this.configService.findOne(id);

    const { clusterIds, workspaceIds } =
      await this.getUserAccessibleResources(authToken);

    if (!this.hasAccessToConfig(existingConfig, clusterIds, workspaceIds)) {
      throw new ForbiddenException(
        'You do not have access to this configuration',
      );
    }

    // Also check access to new source/destination if being updated
    if (updateDto.source) {
      const hasNewSourceAccess =
        clusterIds.has(updateDto.source.clusterId) &&
        workspaceIds.has(updateDto.source.workspaceId);

      if (!hasNewSourceAccess) {
        throw new ForbiddenException(
          'You do not have access to the specified source cluster/workspace',
        );
      }
    }

    if (updateDto.destination) {
      const hasNewDestinationAccess =
        clusterIds.has(updateDto.destination.clusterId) &&
        workspaceIds.has(updateDto.destination.workspaceId);

      if (!hasNewDestinationAccess) {
        throw new ForbiddenException(
          'You do not have access to the specified destination cluster/workspace',
        );
      }
    }

    return this.configService.update(id, updateDto);
  }

  /**
   * Delete a configuration (with access check)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Headers('authorization') authHeader: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const authToken = this.requireAuthToken(authHeader);

    const config = await this.configService.findOne(id);
    const { clusterIds, workspaceIds } =
      await this.getUserAccessibleResources(authToken);

    if (!this.hasAccessToConfig(config, clusterIds, workspaceIds)) {
      throw new ForbiddenException(
        'You do not have access to this configuration',
      );
    }

    return this.configService.remove(id);
  }
}
