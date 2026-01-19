import {
  Controller,
  Get,
  Param,
  Query,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ExternalDataService,
  Cluster,
  Workspace,
} from './external-data.service';

@Controller('api')
export class ExternalDataController {
  constructor(
    private readonly externalDataService: ExternalDataService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Extract authorization header or use fallback token for local development
   */
  private getAuthToken(authHeader?: string): string {
    if (authHeader) {
      return authHeader;
    }

    // Fallback to environment token for local development
    const fallbackToken = this.configService.get<string>('TF_API_TOKEN');
    if (fallbackToken) {
      return `Bearer ${fallbackToken}`;
    }

    throw new HttpException(
      'Authorization header is required',
      HttpStatus.UNAUTHORIZED,
    );
  }

  /**
   * Get all clusters from TrueFoundry
   */
  @Get('clusters')
  async getClusters(
    @Headers('authorization') authHeader: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ data: Cluster[]; pagination?: object }> {
    const authToken = this.getAuthToken(authHeader);
    return this.externalDataService.getClusters(
      authToken,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }

  /**
   * Get cluster by ID
   */
  @Get('clusters/:id')
  async getClusterById(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ): Promise<Cluster> {
    const authToken = this.getAuthToken(authHeader);
    return this.externalDataService.getClusterById(authToken, id);
  }

  /**
   * Get all workspaces from TrueFoundry
   */
  @Get('workspaces')
  async getWorkspaces(
    @Headers('authorization') authHeader: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('clusterId') clusterId?: string,
  ): Promise<{ data: Workspace[]; pagination?: object }> {
    const authToken = this.getAuthToken(authHeader);
    return this.externalDataService.getWorkspaces(authToken, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      clusterId,
    });
  }

  /**
   * Get workspace by ID
   */
  @Get('workspaces/:id')
  async getWorkspaceById(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ): Promise<Workspace> {
    const authToken = this.getAuthToken(authHeader);
    return this.externalDataService.getWorkspaceById(authToken, id);
  }
}
