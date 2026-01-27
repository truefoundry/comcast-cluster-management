import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExternalDataService, JobRun, JobRunStatus } from '../external-data';
import {
  ClusterFallbackConfigService,
  ClusterFallbackConfigResponse,
} from './cluster-fallback-config.service';

/**
 * Grouped fallback configs by source (clusterId + workspaceId)
 */
interface GroupedFallbackConfigs {
  sourceClusterId: string;
  sourceWorkspaceId: string;
  /** Configs with specific jobId - higher priority */
  jobSpecificConfigs: ClusterFallbackConfigResponse[];
  /** Configs without jobId - lower priority, applies to all jobs */
  genericConfigs: ClusterFallbackConfigResponse[];
}

/**
 * Job Fallback Scheduler Service
 *
 * Periodically checks for stuck jobs and moves them from source to destination
 * cluster/workspace based on fallback configurations.
 *
 * Priority: Job-specific configs are matched first, then generic configs.
 */
@Injectable()
export class JobFallbackSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobFallbackSchedulerService.name);
  private readonly stuckThresholdMinutes: number;
  private readonly enabled: boolean;
  private serviceToken: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly fallbackConfigService: ClusterFallbackConfigService,
    private readonly externalDataService: ExternalDataService,
  ) {
    this.stuckThresholdMinutes = this.configService.get<number>(
      'JOB_FALLBACK_STUCK_THRESHOLD_MINUTES',
      60,
    );
    this.enabled = this.configService.get<boolean>(
      'JOB_FALLBACK_ENABLED',
      false,
    );
  }

  onModuleInit() {
    const token = this.configService.get<string>('TF_SERVICE_API_TOKEN');
    if (token) {
      this.serviceToken = `Bearer ${token}`;
      this.logger.log('Job fallback scheduler initialized with service token');
    } else {
      this.logger.warn(
        'TF_SERVICE_API_TOKEN not configured. Job fallback scheduler will be disabled.',
      );
    }

    if (this.enabled) {
      this.logger.log(
        `Job fallback scheduler enabled. Stuck threshold: ${this.stuckThresholdMinutes} minutes`,
      );
    } else {
      this.logger.log('Job fallback scheduler is disabled');
    }
  }

  /**
   * Check if a job is stuck based on createdAt timestamp
   */
  private isJobStuck(jobRun: JobRun): boolean {
    const createdAtMs = jobRun.createdAt;
    const nowMs = Date.now();
    const diffMinutes = (nowMs - createdAtMs) / (1000 * 60);
    return diffMinutes > this.stuckThresholdMinutes;
  }

  /**
   * Group fallback configs by source (clusterId + workspaceId)
   * and separate job-specific from generic configs
   */
  private groupFallbackConfigs(
    configs: ClusterFallbackConfigResponse[],
  ): Map<string, GroupedFallbackConfigs> {
    const grouped = new Map<string, GroupedFallbackConfigs>();

    for (const config of configs) {
      const key = `${config.source.clusterId}:${config.source.workspaceId}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          sourceClusterId: config.source.clusterId,
          sourceWorkspaceId: config.source.workspaceId,
          jobSpecificConfigs: [],
          genericConfigs: [],
        });
      }

      const group = grouped.get(key)!;

      if (config.source.jobId) {
        group.jobSpecificConfigs.push(config);
      } else {
        group.genericConfigs.push(config);
      }
    }

    return grouped;
  }

  /**
   * Find the matching fallback config for a job run
   * Priority: Job-specific configs first, then generic configs
   */
  private findMatchingConfig(
    jobRun: JobRun,
    group: GroupedFallbackConfigs,
  ): ClusterFallbackConfigResponse | null {
    // First, check job-specific configs (higher priority)
    for (const config of group.jobSpecificConfigs) {
      if (config.source.jobId === jobRun.applicationId) {
        return config;
      }
    }

    // Fall back to generic config (first one if multiple exist)
    if (group.genericConfigs.length > 0) {
      return group.genericConfigs[0];
    }

    return null;
  }

  /**
   * Generate a unique fallback job name
   */
  private generateFallbackName(baseName: string): string {
    const timestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const truncatedBase = baseName.substring(0, 30);
    return `${truncatedBase}-fb-${timestamp}-${randomSuffix}`;
  }

  /**
   * Modify manifest for the destination cluster/workspace
   */
  private modifyManifestForDestination(
    manifest: Record<string, unknown>,
    destinationWorkspaceFqn: string,
    newName: string,
  ): Record<string, unknown> {
    return {
      ...manifest,
      name: newName,
      workspace_fqn: destinationWorkspaceFqn,
    };
  }

  /**
   * Move a stuck job to the destination cluster/workspace
   */
  private async moveJobToDestination(
    jobRun: JobRun,
    config: ClusterFallbackConfigResponse,
  ): Promise<void> {
    this.logger.log(
      `Moving stuck job ${jobRun.name} (app: ${jobRun.applicationId}) ` +
        `from ${config.source.clusterId}/${config.source.workspaceId} ` +
        `to ${config.destination.clusterId}/${config.destination.workspaceId}`,
    );

    try {
      // 1. Get the deployment manifest
      const deployment = await this.externalDataService.getDeployment(
        this.serviceToken!,
        jobRun.applicationId,
        jobRun.deploymentVersion,
      );

      if (!deployment.manifest) {
        this.logger.error(
          `No manifest found for application ${jobRun.applicationId}`,
        );
        return;
      }

      // 2. Get destination workspace FQN
      const destWorkspace = await this.externalDataService.getWorkspaceById(
        this.serviceToken!,
        config.destination.workspaceId,
      );

      if (!destWorkspace.fqn) {
        this.logger.error(
          `No FQN found for destination workspace ${config.destination.workspaceId}`,
        );
        return;
      }

      // 3. Modify manifest for destination
      const newName = this.generateFallbackName(jobRun.applicationName);
      const modifiedManifest = this.modifyManifestForDestination(
        deployment.manifest,
        destWorkspace.fqn,
        newName,
      );

      // 4. Create application on destination
      const createResponse = await this.externalDataService.createApplication(
        this.serviceToken!,
        {
          manifest: modifiedManifest,
          dryRun: false,
          forceDeploy: true,
          triggerOnDeploy: false,
        },
      );

      const createdAppId =
        createResponse.application?.id ||
        createResponse.deployment.applicationId;

      this.logger.log(
        `Created application ${createdAppId} on destination cluster`,
      );

      // 5. Parse and prepare trigger input from original job command
      let triggerInput: Record<string, unknown> | undefined;
      if (jobRun.command) {
        try {
          triggerInput = JSON.parse(jobRun.command) as Record<string, unknown>;
        } catch {
          this.logger.warn(
            `Failed to parse job command as JSON for ${jobRun.name}. Triggering without input.`,
          );
        }
      }

      // 6. Trigger the job on destination
      await this.externalDataService.triggerJob(this.serviceToken!, {
        applicationId: createdAppId,
        input: triggerInput,
      });

      this.logger.log(
        `Triggered job for application ${createdAppId} on destination`,
      );

      // 7. Terminate the stuck job on source
      await this.externalDataService.terminateJobRun(
        this.serviceToken!,
        jobRun.deploymentId,
        jobRun.name,
      );

      this.logger.log(`Terminated stuck job ${jobRun.name} on source cluster`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to move job ${jobRun.name} to destination: ${errorMsg}`,
      );
    }
  }

  /**
   * Process fallback for a single source (cluster + workspace)
   */
  private async processSourceFallback(
    group: GroupedFallbackConfigs,
  ): Promise<void> {
    this.logger.debug(
      `Processing fallback for source: ${group.sourceClusterId}/${group.sourceWorkspaceId}`,
    );

    try {
      // Fetch job runs with CREATED status from the source
      const { data: jobRuns } =
        await this.externalDataService.getJobRunsByClusterAndWorkspace(
          this.serviceToken!,
          group.sourceClusterId,
          group.sourceWorkspaceId,
          { status: JobRunStatus.CREATED },
        );

      this.logger.debug(
        `Found ${jobRuns.length} CREATED job runs in source ${group.sourceClusterId}/${group.sourceWorkspaceId}`,
      );

      // Process each job run
      for (const jobRun of jobRuns) {
        // Skip if not stuck
        if (!this.isJobStuck(jobRun)) {
          continue;
        }

        // Find matching config
        const matchingConfig = this.findMatchingConfig(jobRun, group);
        if (!matchingConfig) {
          this.logger.debug(
            `No matching fallback config for stuck job ${jobRun.name} (app: ${jobRun.applicationId})`,
          );
          continue;
        }

        // Move the job to destination
        await this.moveJobToDestination(jobRun, matchingConfig);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error processing fallback for source ${group.sourceClusterId}/${group.sourceWorkspaceId}: ${errorMsg}`,
      );
    }
  }

  /**
   * Main cron job that runs periodically to check for stuck jobs
   * Default: Every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async runFallbackCheck(): Promise<void> {
    // Skip if disabled
    if (!this.enabled) {
      return;
    }

    // Skip if no service token configured
    if (!this.serviceToken) {
      this.logger.warn(
        'Skipping fallback check: TF_SERVICE_API_TOKEN not configured',
      );
      return;
    }

    this.logger.log('Starting job fallback check...');

    try {
      // Get all fallback configurations
      const allConfigs = await this.fallbackConfigService.findAll();

      if (allConfigs.length === 0) {
        this.logger.debug('No fallback configurations found. Skipping.');
        return;
      }

      this.logger.debug(`Found ${allConfigs.length} fallback configurations`);

      // Group configs by source
      const groupedConfigs = this.groupFallbackConfigs(allConfigs);

      // Process each source
      for (const group of groupedConfigs.values()) {
        await this.processSourceFallback(group);
      }

      this.logger.log('Job fallback check completed');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in job fallback check: ${errorMsg}`);
    }
  }
}
