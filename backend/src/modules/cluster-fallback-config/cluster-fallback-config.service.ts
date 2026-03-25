import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ClusterFallbackConfig } from '../../models/index.js';
import {
  CreateClusterFallbackConfigDto,
  UpdateClusterFallbackConfigDto,
} from './dto/index.js';

export interface ClusterFallbackConfigResponse {
  id: string;
  source: {
    clusterId: string;
    workspaceId: string;
    jobId?: string;
  };
  destination: {
    clusterId: string;
    workspaceId: string;
    workspaceFqn: string;
  };
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ClusterFallbackConfigService {
  constructor(
    @InjectModel(ClusterFallbackConfig)
    private readonly configModel: typeof ClusterFallbackConfig,
  ) {}

  private toResponse(
    config: ClusterFallbackConfig,
  ): ClusterFallbackConfigResponse {
    return {
      id: config.id,
      source: {
        clusterId: config.sourceClusterId,
        workspaceId: config.sourceWorkspaceId,
        jobId: config.sourceJobId || undefined,
      },
      destination: {
        clusterId: config.destinationClusterId,
        workspaceId: config.destinationWorkspaceId,
        workspaceFqn: config.destinationWorkspaceFqn,
      },
      createdBy: config.createdBy || undefined,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Check for duplicate configurations.
   * Only ONE generic config (no jobId) per source cluster/workspace.
   * Only ONE job-specific config per source cluster/workspace/jobId.
   */
  private async findDuplicateConfig(
    sourceClusterId: string,
    sourceWorkspaceId: string,
    sourceJobId: string | null,
    excludeId?: string,
  ): Promise<ClusterFallbackConfig | null> {
    const where: Record<string, unknown> = {
      sourceClusterId,
      sourceWorkspaceId,
      sourceJobId: sourceJobId ?? null,
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    return this.configModel.findOne({ where });
  }

  private async validateNoDuplicate(
    sourceClusterId: string,
    sourceWorkspaceId: string,
    sourceJobId: string | null,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.findDuplicateConfig(
      sourceClusterId,
      sourceWorkspaceId,
      sourceJobId,
      excludeId,
    );

    if (duplicate) {
      if (sourceJobId === null) {
        throw new ConflictException(
          `A generic fallback config already exists for source cluster "${sourceClusterId}" and workspace "${sourceWorkspaceId}". ` +
            `Only one generic config (without jobId) is allowed per source cluster/workspace combination.`,
        );
      } else {
        throw new ConflictException(
          `A fallback config already exists for source cluster "${sourceClusterId}", workspace "${sourceWorkspaceId}", and job "${sourceJobId}". ` +
            `Only one config per source cluster/workspace/job combination is allowed.`,
        );
      }
    }
  }

  async create(
    createDto: CreateClusterFallbackConfigDto,
    createdBy?: string,
  ): Promise<ClusterFallbackConfigResponse> {
    await this.validateNoDuplicate(
      createDto.source.clusterId,
      createDto.source.workspaceId,
      createDto.source.jobId || null,
    );

    const config = await this.configModel.create({
      sourceClusterId: createDto.source.clusterId,
      sourceWorkspaceId: createDto.source.workspaceId,
      sourceJobId: createDto.source.jobId || null,
      destinationClusterId: createDto.destination.clusterId,
      destinationWorkspaceId: createDto.destination.workspaceId,
      destinationWorkspaceFqn: createDto.destination.workspaceFqn,
      createdBy: createdBy || null,
    });

    return this.toResponse(config);
  }

  async findAll(): Promise<ClusterFallbackConfigResponse[]> {
    const configs = await this.configModel.findAll({
      order: [['createdAt', 'DESC']],
    });
    return configs.map((config) => this.toResponse(config));
  }

  async findAllForUser(
    accessibleClusterIds: Set<string>,
    accessibleWorkspaceIds: Set<string>,
  ): Promise<ClusterFallbackConfigResponse[]> {
    const configs = await this.configModel.findAll({
      where: {
        sourceClusterId: { [Op.in]: [...accessibleClusterIds] },
        sourceWorkspaceId: { [Op.in]: [...accessibleWorkspaceIds] },
        destinationClusterId: { [Op.in]: [...accessibleClusterIds] },
        destinationWorkspaceId: { [Op.in]: [...accessibleWorkspaceIds] },
      },
      order: [['createdAt', 'DESC']],
    });

    return configs.map((config) => this.toResponse(config));
  }

  async findOne(id: string): Promise<ClusterFallbackConfigResponse> {
    const config = await this.configModel.findByPk(id);

    if (!config) {
      throw new NotFoundException(`Configuration with ID ${id} not found`);
    }

    return this.toResponse(config);
  }

  async findBySourceCluster(
    clusterId: string,
  ): Promise<ClusterFallbackConfigResponse[]> {
    const configs = await this.configModel.findAll({
      where: { sourceClusterId: clusterId },
      order: [['createdAt', 'DESC']],
    });
    return configs.map((config) => this.toResponse(config));
  }

  async findBySourceWorkspace(
    workspaceId: string,
  ): Promise<ClusterFallbackConfigResponse[]> {
    const configs = await this.configModel.findAll({
      where: { sourceWorkspaceId: workspaceId },
      order: [['createdAt', 'DESC']],
    });
    return configs.map((config) => this.toResponse(config));
  }

  async update(
    id: string,
    updateDto: UpdateClusterFallbackConfigDto,
  ): Promise<ClusterFallbackConfigResponse> {
    const config = await this.configModel.findByPk(id);

    if (!config) {
      throw new NotFoundException(`Configuration with ID ${id} not found`);
    }

    if (updateDto.source) {
      await this.validateNoDuplicate(
        updateDto.source.clusterId,
        updateDto.source.workspaceId,
        updateDto.source.jobId || null,
        id,
      );
    }

    const updates: Partial<ClusterFallbackConfig> = {};

    if (updateDto.source) {
      updates.sourceClusterId = updateDto.source.clusterId;
      updates.sourceWorkspaceId = updateDto.source.workspaceId;
      updates.sourceJobId = updateDto.source.jobId || null;
    }

    if (updateDto.destination) {
      updates.destinationClusterId = updateDto.destination.clusterId;
      updates.destinationWorkspaceId = updateDto.destination.workspaceId;
      updates.destinationWorkspaceFqn = updateDto.destination.workspaceFqn;
    }

    await config.update(updates);
    return this.toResponse(config);
  }

  async remove(id: string): Promise<void> {
    const config = await this.configModel.findByPk(id);

    if (!config) {
      throw new NotFoundException(`Configuration with ID ${id} not found`);
    }

    await config.destroy();
  }
}
