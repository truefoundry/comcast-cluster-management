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
  private readonly triggerMaxRetries: number;
  private readonly triggerRetryDelayMs: number;
  private serviceToken: string | null = null;
  /** Lock to prevent overlapping cron runs */
  private isRunning = false;

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
    this.triggerMaxRetries = this.configService.get<number>(
      'JOB_FALLBACK_TRIGGER_MAX_RETRIES',
      3,
    );
    this.triggerRetryDelayMs = this.configService.get<number>(
      'JOB_FALLBACK_TRIGGER_RETRY_DELAY_MS',
      3000,
    );
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('Job fallback scheduler is disabled');
      return;
    }

    const token = this.configService.get<string>('TF_SERVICE_API_TOKEN');
    if (!token) {
      this.logger.error(
        'TF_SERVICE_API_TOKEN not configured. Job fallback scheduler cannot start.',
      );
      return;
    }

    this.serviceToken = `Bearer ${token}`;
    this.logger.log(
      `Job fallback scheduler enabled. Stuck threshold: ${this.stuckThresholdMinutes} minutes`,
    );
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
   * Pattern: ^[a-z](?:[a-z0-9]|-(?!-)){1,30}[a-z0-9]$ (max 32 chars)
   */
  private generateFallbackName(baseName: string): string {
    // Sanitize base name: lowercase, replace invalid chars with hyphens
    const sanitized = baseName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-') // Remove consecutive hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // Generate random suffix (7 chars)
    const randomSuffix = Math.random().toString(36).substring(2, 9);

    // Truncate base to fit: 32 - 4 ("-fb-") - 7 (suffix) = 21 chars max
    const truncatedBase = sanitized.substring(0, 21);

    // Ensure result starts with letter and ends with alphanumeric
    let result = `${truncatedBase}-fb-${randomSuffix}`;

    // Ensure starts with letter
    if (!/^[a-z]/.test(result)) {
      result = 'j' + result.substring(1);
    }

    return result;
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
   * Trigger a job with retry logic for "Active deployment not found" errors
   */
  private async triggerJobWithRetry(
    applicationId: string,
    input: Record<string, unknown> | undefined,
    tenantName: string,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.triggerMaxRetries; attempt++) {
      try {
        await this.externalDataService.triggerJob(
          this.serviceToken!,
          { applicationId, input },
          tenantName,
        );
        this.logger.log(
          `Triggered job for application ${applicationId} on destination`,
        );
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const isDeploymentNotReady = lastError.message.includes(
          'Active deployment not found',
        );

        if (isDeploymentNotReady && attempt < this.triggerMaxRetries) {
          this.logger.debug(
            `Deployment not ready yet for ${applicationId}, retrying in ${this.triggerRetryDelayMs}ms (attempt ${attempt}/${this.triggerMaxRetries})`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, this.triggerRetryDelayMs),
          );
        } else {
          // Non-retryable error or max retries reached
          break;
        }
      }
    }

    throw lastError!;
  }

  /**
   * Terminate a job run with retry logic for transient errors
   */
  private async terminateJobWithRetry(
    jobRunId: string,
    jobRunName: string,
    tenantName: string,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.triggerMaxRetries; attempt++) {
      try {
        await this.externalDataService.terminateJobRun(
          this.serviceToken!,
          jobRunId,
          tenantName,
        );
        this.logger.log(
          `Terminated stuck job ${jobRunName} (id: ${jobRunId}) on source cluster`,
        );
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.triggerMaxRetries) {
          this.logger.debug(
            `Failed to terminate job ${jobRunName}, retrying in ${this.triggerRetryDelayMs}ms (attempt ${attempt}/${this.triggerMaxRetries})`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, this.triggerRetryDelayMs),
          );
        } else {
          break;
        }
      }
    }

    throw lastError!;
  }

  /**
   * Move a stuck job to the destination cluster/workspace
   */
  private async moveJobToDestination(
    jobRun: JobRun,
    config: ClusterFallbackConfigResponse,
  ): Promise<void> {
    const tenantName = jobRun.tenantName;
    if (!tenantName) {
      this.logger.error(
        `No tenantName found for job ${jobRun.name}. Cannot proceed with fallback.`,
      );
      return;
    }

    this.logger.log(
      `Moving stuck job ${jobRun.name} (app: ${jobRun.applicationId}, tenant: ${tenantName}) ` +
        `from ${config.source.clusterId}/${config.source.workspaceId} ` +
        `to ${config.destination.clusterId}/${config.destination.workspaceId}`,
    );

    try {
      // 1. Get the deployment manifest
      const deployment = await this.externalDataService.getDeployment(
        this.serviceToken!,
        jobRun.applicationId,
        jobRun.deploymentVersion,
        tenantName,
      );

      if (!deployment.manifest) {
        this.logger.error(
          `No manifest found for application ${jobRun.applicationId}`,
        );
        return;
      }

      // 2. Get destination workspace FQN from config (no extra API call needed)
      const destWorkspaceFqn = config.destination.workspaceFqn;

      if (!destWorkspaceFqn) {
        this.logger.error(
          `No workspace FQN stored for destination workspace ${config.destination.workspaceId}. ` +
            `Please update the fallback config to include the workspace FQN.`,
        );
        return;
      }

      // 3. Modify manifest for destination
      const newName = this.generateFallbackName(jobRun.applicationName);
      const modifiedManifest = this.modifyManifestForDestination(
        deployment.manifest,
        destWorkspaceFqn,
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
        tenantName,
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

      // 6. Wait for deployment to be ready before triggering
      const triggerDelayMs = this.configService.get<number>(
        'JOB_FALLBACK_TRIGGER_DELAY_MS',
        5000,
      );
      this.logger.debug(
        `Waiting ${triggerDelayMs}ms before triggering job on destination`,
      );
      await new Promise((resolve) => setTimeout(resolve, triggerDelayMs));

      // 7. Trigger the job on destination with retry
      await this.triggerJobWithRetry(createdAppId, triggerInput, tenantName);

      // 8. Terminate the stuck job on source with retry
      await this.terminateJobWithRetry(jobRun.id, jobRun.name, tenantName);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to move job ${jobRun.name} to destination: ${errorMsg}`,
      );
    }
  }

  /**
   * Process fallback for a single source (cluster + workspace)
   * Paginates through all job runs to handle cases with >100 stuck jobs
   */
  private async processSourceFallback(
    group: GroupedFallbackConfigs,
  ): Promise<void> {
    this.logger.debug(
      `Processing fallback for source: ${group.sourceClusterId}/${group.sourceWorkspaceId}`,
    );

    try {
      const pageSize = 100;
      let offset = 0;
      let totalProcessed = 0;

      // Paginate through all job runs
      while (true) {
        const { data: jobRuns, pagination } =
          await this.externalDataService.getJobRunsByClusterAndWorkspace(
            this.serviceToken!,
            group.sourceClusterId,
            group.sourceWorkspaceId,
            {
              status: [JobRunStatus.CREATED, JobRunStatus.SCHEDULED],
              limit: pageSize,
              offset,
            },
          );

        this.logger.debug(
          `Fetched ${jobRuns.length} job runs (offset: ${offset}, hasMore: ${pagination.hasMore})`,
        );

        // Process each job run in this page
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
          totalProcessed++;
        }

        // Check if we've fetched all pages
        if (!pagination.hasMore || jobRuns.length === 0) {
          break;
        }
        offset += jobRuns.length;
      }

      if (totalProcessed > 0) {
        this.logger.log(
          `Processed ${totalProcessed} stuck jobs from ${group.sourceClusterId}/${group.sourceWorkspaceId}`,
        );
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

    // Skip if previous run is still in progress
    if (this.isRunning) {
      this.logger.warn(
        'Skipping fallback check: Previous run still in progress',
      );
      return;
    }

    this.isRunning = true;
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
    } finally {
      this.isRunning = false;
    }
  }
}
