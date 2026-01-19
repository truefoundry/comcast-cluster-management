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
    const fallbackToken = this.appConfigService.get<string>('TF_API_TOKEN');
    if (fallbackToken) {
      return `Bearer ${fallbackToken}`;
    }
    return undefined;
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
   * Create a new cluster fallback configuration
   */
  @Post()
  async create(
    @Headers('authorization') authHeader: string,
    @Body() createDto: CreateClusterFallbackConfigDto,
  ): Promise<ClusterFallbackConfigResponse> {
    const userId = await this.getUserId(authHeader);
    return this.configService.create(createDto, userId);
  }

  /**
   * Get all configurations
   *
   * Query params:
   * - sourceClusterId: Filter by source cluster
   * - sourceWorkspaceId: Filter by source workspace
   */
  @Get()
  async findAll(
    @Query('sourceClusterId') sourceClusterId?: string,
    @Query('sourceWorkspaceId') sourceWorkspaceId?: string,
  ): Promise<ClusterFallbackConfigResponse[]> {
    if (sourceClusterId) {
      return this.configService.findBySourceCluster(sourceClusterId);
    }
    if (sourceWorkspaceId) {
      return this.configService.findBySourceWorkspace(sourceWorkspaceId);
    }
    return this.configService.findAll();
  }

  /**
   * Get configuration by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClusterFallbackConfigResponse> {
    return this.configService.findOne(id);
  }

  /**
   * Update a configuration
   */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateClusterFallbackConfigDto,
  ): Promise<ClusterFallbackConfigResponse> {
    return this.configService.update(id, updateDto);
  }

  /**
   * Delete a configuration
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.configService.remove(id);
  }
}
