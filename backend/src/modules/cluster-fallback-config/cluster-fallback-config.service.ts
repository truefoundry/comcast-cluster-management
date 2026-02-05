import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
// ============================================================
// TypeORM imports (Uncomment when ready to use PostgreSQL)
// ============================================================
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { ClusterFallbackConfig } from '../../entities';

import { JsonStorage, StorageRecord } from '../../lib/json-storage';
import {
  CreateClusterFallbackConfigDto,
  UpdateClusterFallbackConfigDto,
} from './dto';

// ============================================================
// JSON Storage Record Interface (for file-based storage)
// ============================================================
interface ClusterFallbackConfigRecord extends StorageRecord {
  sourceClusterId: string;
  sourceWorkspaceId: string;
  sourceJobId: string | null;
  destinationClusterId: string;
  destinationWorkspaceId: string;
  destinationWorkspaceFqn: string;
  createdBy: string | null;
}

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
  // ============================================================
  // JSON File Storage (current implementation)
  // ============================================================
  private storage: JsonStorage<ClusterFallbackConfigRecord>;

  constructor() {
    // ============================================================
    // TypeORM Repository (Uncomment when ready to use PostgreSQL)
    // ============================================================
    // @InjectRepository(ClusterFallbackConfig)
    // private readonly configRepository: Repository<ClusterFallbackConfig>,
    // JSON file storage initialization
    this.storage = new JsonStorage<ClusterFallbackConfigRecord>(
      'cluster-fallback-configs.json',
    );
  }

  /**
   * Transform record to response format (matching frontend expectations)
   */
  private toResponse(
    record: ClusterFallbackConfigRecord,
  ): ClusterFallbackConfigResponse {
    return {
      id: record.id,
      source: {
        clusterId: record.sourceClusterId,
        workspaceId: record.sourceWorkspaceId,
        jobId: record.sourceJobId || undefined,
      },
      destination: {
        clusterId: record.destinationClusterId,
        workspaceId: record.destinationWorkspaceId,
        workspaceFqn: record.destinationWorkspaceFqn,
      },
      createdBy: record.createdBy || undefined,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    };
  }

  /**
   * Check for duplicate configurations
   * Rules:
   * - Only ONE generic config (no jobId) per source cluster/workspace
   * - Only ONE job-specific config per source cluster/workspace/jobId
   *
   * @param sourceClusterId - Source cluster ID
   * @param sourceWorkspaceId - Source workspace ID
   * @param sourceJobId - Source job ID (null for generic config)
   * @param excludeId - Optional ID to exclude (for update operations)
   * @returns The duplicate record if found, null otherwise
   */
  private findDuplicateConfig(
    sourceClusterId: string,
    sourceWorkspaceId: string,
    sourceJobId: string | null,
    excludeId?: string,
  ): ClusterFallbackConfigRecord | null {
    const duplicates = this.storage.findBy((record) => {
      // Exclude the current record (for updates)
      if (excludeId && record.id === excludeId) {
        return false;
      }

      // Match source cluster and workspace
      if (
        record.sourceClusterId !== sourceClusterId ||
        record.sourceWorkspaceId !== sourceWorkspaceId
      ) {
        return false;
      }

      // For generic configs (no jobId), check if another generic config exists
      if (sourceJobId === null) {
        return record.sourceJobId === null;
      }

      // For job-specific configs, check if same jobId exists
      return record.sourceJobId === sourceJobId;
    });

    return duplicates.length > 0 ? duplicates[0] : null;
  }

  /**
   * Validate no duplicate config exists, throw ConflictException if found
   */
  private validateNoDuplicate(
    sourceClusterId: string,
    sourceWorkspaceId: string,
    sourceJobId: string | null,
    excludeId?: string,
  ): void {
    const duplicate = this.findDuplicateConfig(
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

  // ============================================================
  // TypeORM version of toResponse (Uncomment when using PostgreSQL)
  // ============================================================
  // private toResponse(
  //   config: ClusterFallbackConfig,
  // ): ClusterFallbackConfigResponse {
  //   return {
  //     id: config.id,
  //     source: {
  //       clusterId: config.sourceClusterId,
  //       workspaceId: config.sourceWorkspaceId,
  //       jobId: config.sourceJobId || undefined,
  //     },
  //     destination: {
  //       clusterId: config.destinationClusterId,
  //       workspaceId: config.destinationWorkspaceId,
  //     },
  //     createdBy: config.createdBy || undefined,
  //     createdAt: config.createdAt,
  //     updatedAt: config.updatedAt,
  //   };
  // }

  /**
   * Create a new cluster fallback configuration
   */
  async create(
    createDto: CreateClusterFallbackConfigDto,
    createdBy?: string,
  ): Promise<ClusterFallbackConfigResponse> {
    // Validate no duplicate config exists
    this.validateNoDuplicate(
      createDto.source.clusterId,
      createDto.source.workspaceId,
      createDto.source.jobId || null,
    );

    // JSON Storage implementation
    const record = this.storage.create({
      sourceClusterId: createDto.source.clusterId,
      sourceWorkspaceId: createDto.source.workspaceId,
      sourceJobId: createDto.source.jobId || null,
      destinationClusterId: createDto.destination.clusterId,
      destinationWorkspaceId: createDto.destination.workspaceId,
      destinationWorkspaceFqn: createDto.destination.workspaceFqn || null,
      createdBy: createdBy || null,
    });

    return this.toResponse(record);

    // ============================================================
    // TypeORM implementation (Uncomment when using PostgreSQL)
    // ============================================================
    // const config = this.configRepository.create({
    //   sourceClusterId: createDto.source.clusterId,
    //   sourceWorkspaceId: createDto.source.workspaceId,
    //   sourceJobId: createDto.source.jobId || null,
    //   destinationClusterId: createDto.destination.clusterId,
    //   destinationWorkspaceId: createDto.destination.workspaceId,
    //   createdBy: createdBy || null,
    // });
    // const savedConfig = await this.configRepository.save(config);
    // return this.toResponse(savedConfig);
  }

  /**
   * Find all configurations
   */
  async findAll(): Promise<ClusterFallbackConfigResponse[]> {
    // JSON Storage implementation
    const records = this.storage.findAll();
    return records.map((record) => this.toResponse(record));

    // ============================================================
    // TypeORM implementation (Uncomment when using PostgreSQL)
    // ============================================================
    // const configs = await this.configRepository.find({
    //   order: { createdAt: 'DESC' },
    // });
    // return configs.map((config) => this.toResponse(config));
  }

  /**
   * Find all configurations filtered by accessible clusters and workspaces
   */
  async findAllForUser(
    accessibleClusterIds: Set<string>,
    accessibleWorkspaceIds: Set<string>,
  ): Promise<ClusterFallbackConfigResponse[]> {
    // JSON Storage implementation
    const records = this.storage.findBy((record) => {
      // User must have access to BOTH source and destination clusters/workspaces
      const hasSourceAccess =
        accessibleClusterIds.has(record.sourceClusterId) &&
        accessibleWorkspaceIds.has(record.sourceWorkspaceId);

      const hasDestinationAccess =
        accessibleClusterIds.has(record.destinationClusterId) &&
        accessibleWorkspaceIds.has(record.destinationWorkspaceId);

      return hasSourceAccess && hasDestinationAccess;
    });

    return records.map((record) => this.toResponse(record));

    // ============================================================
    // TypeORM implementation (Uncomment when using PostgreSQL)
    // ============================================================
    // const configs = await this.configRepository.find({
    //   order: { createdAt: 'DESC' },
    // });
    // return configs
    //   .filter((config) => {
    //     const hasSourceAccess =
    //       accessibleClusterIds.has(config.sourceClusterId) &&
    //       accessibleWorkspaceIds.has(config.sourceWorkspaceId);
    //     const hasDestinationAccess =
    //       accessibleClusterIds.has(config.destinationClusterId) &&
    //       accessibleWorkspaceIds.has(config.destinationWorkspaceId);
    //     return hasSourceAccess && hasDestinationAccess;
    //   })
    //   .map((config) => this.toResponse(config));
  }

  /**
   * Find configuration by ID
   */
  async findOne(id: string): Promise<ClusterFallbackConfigResponse> {
    // JSON Storage implementation
    const record = this.storage.findOne(id);

    if (!record) {
      throw new NotFoundException(`Configuration with ID ${id} not found`);
    }

    return this.toResponse(record);

    // ============================================================
    // TypeORM implementation (Uncomment when using PostgreSQL)
    // ============================================================
    // const config = await this.configRepository.findOne({
    //   where: { id },
    // });
    // if (!config) {
    //   throw new NotFoundException(`Configuration with ID ${id} not found`);
    // }
    // return this.toResponse(config);
  }

  /**
   * Find configurations by source cluster ID
   */
  async findBySourceCluster(
    clusterId: string,
  ): Promise<ClusterFallbackConfigResponse[]> {
    // JSON Storage implementation
    const records = this.storage.findBy(
      (record) => record.sourceClusterId === clusterId,
    );
    return records.map((record) => this.toResponse(record));

    // ============================================================
    // TypeORM implementation (Uncomment when using PostgreSQL)
    // ============================================================
    // const configs = await this.configRepository.find({
    //   where: { sourceClusterId: clusterId },
    //   order: { createdAt: 'DESC' },
    // });
    // return configs.map((config) => this.toResponse(config));
  }

  /**
   * Find configurations by source workspace ID
   */
  async findBySourceWorkspace(
    workspaceId: string,
  ): Promise<ClusterFallbackConfigResponse[]> {
    // JSON Storage implementation
    const records = this.storage.findBy(
      (record) => record.sourceWorkspaceId === workspaceId,
    );
    return records.map((record) => this.toResponse(record));

    // ============================================================
    // TypeORM implementation (Uncomment when using PostgreSQL)
    // ============================================================
    // const configs = await this.configRepository.find({
    //   where: { sourceWorkspaceId: workspaceId },
    //   order: { createdAt: 'DESC' },
    // });
    // return configs.map((config) => this.toResponse(config));
  }

  /**
   * Update a configuration
   */
  async update(
    id: string,
    updateDto: UpdateClusterFallbackConfigDto,
  ): Promise<ClusterFallbackConfigResponse> {
    // JSON Storage implementation
    const existing = this.storage.findOne(id);

    if (!existing) {
      throw new NotFoundException(`Configuration with ID ${id} not found`);
    }

    // If source is being updated, validate no duplicate exists (excluding current record)
    if (updateDto.source) {
      this.validateNoDuplicate(
        updateDto.source.clusterId,
        updateDto.source.workspaceId,
        updateDto.source.jobId || null,
        id, // Exclude current record from duplicate check
      );
    }

    const updates: Partial<ClusterFallbackConfigRecord> = {};

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

    const record = this.storage.update(id, updates);
    return this.toResponse(record!);

    // ============================================================
    // TypeORM implementation (Uncomment when using PostgreSQL)
    // ============================================================
    // const config = await this.configRepository.findOne({
    //   where: { id },
    // });
    // if (!config) {
    //   throw new NotFoundException(`Configuration with ID ${id} not found`);
    // }
    // if (updateDto.source) {
    //   config.sourceClusterId = updateDto.source.clusterId;
    //   config.sourceWorkspaceId = updateDto.source.workspaceId;
    //   config.sourceJobId = updateDto.source.jobId || null;
    // }
    // if (updateDto.destination) {
    //   config.destinationClusterId = updateDto.destination.clusterId;
    //   config.destinationWorkspaceId = updateDto.destination.workspaceId;
    // }
    // const savedConfig = await this.configRepository.save(config);
    // return this.toResponse(savedConfig);
  }

  /**
   * Delete a configuration
   */
  async remove(id: string): Promise<void> {
    // JSON Storage implementation
    const exists = this.storage.findOne(id);

    if (!exists) {
      throw new NotFoundException(`Configuration with ID ${id} not found`);
    }

    this.storage.delete(id);

    // ============================================================
    // TypeORM implementation (Uncomment when using PostgreSQL)
    // ============================================================
    // const config = await this.configRepository.findOne({
    //   where: { id },
    // });
    // if (!config) {
    //   throw new NotFoundException(`Configuration with ID ${id} not found`);
    // }
    // await this.configRepository.remove(config);
  }
}
