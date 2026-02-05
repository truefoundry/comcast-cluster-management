import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExternalDataService, JobRunStatus } from '../external-data';
import { JobFallbackSchedulerService } from './job-fallback-scheduler.service';
import { ClusterFallbackConfigService } from './cluster-fallback-config.service';

/**
 * Test Controller for Fallback APIs
 *
 * Use these endpoints to manually test the TrueFoundry APIs used by the cronjob.
 * WARNING: Some endpoints (trigger, terminate) perform real actions - use with caution!
 */
@Controller('api/fallback-test')
export class FallbackTestController {
  constructor(
    private readonly externalDataService: ExternalDataService,
    private readonly configService: ConfigService,
    private readonly jobFallbackSchedulerService: JobFallbackSchedulerService,
    private readonly fallbackConfigService: ClusterFallbackConfigService,
  ) {}

  /**
   * Get service token from environment
   */
  private getServiceToken(): string {
    const token = this.configService.get<string>('TF_SERVICE_API_TOKEN');
    if (!token) {
      throw new HttpException(
        'TF_SERVICE_API_TOKEN not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return `Bearer ${token}`;
  }

  /**
   * Test 0: Get user info and tenant name (debug endpoint)
   * GET /api/fallback-test/user-info
   */
  @Get('user-info')
  async testGetUserInfo() {
    return this.externalDataService.getUserInfo(this.getServiceToken());
  }

  /**
   * Test 1: Get job runs by cluster and workspace
   * GET /api/fallback-test/job-runs?clusterId=XXX&workspaceId=YYY&status=CREATED
   */
  @Get('job-runs')
  async testGetJobRuns(
    @Query('clusterId') clusterId: string,
    @Query('workspaceId') workspaceId: string,
    @Query('status') status?: string,
  ) {
    if (!clusterId || !workspaceId) {
      throw new HttpException(
        'clusterId and workspaceId are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const jobStatus = status as JobRunStatus | undefined;
    return this.externalDataService.getJobRunsByClusterAndWorkspace(
      this.getServiceToken(),
      clusterId,
      workspaceId,
      { status: jobStatus, limit: 50 },
    );
  }

  /**
   * Test 2: Get deployment by application ID
   * GET /api/fallback-test/deployment?applicationId=XXX&tenantName=YYY&version=ZZZ
   */
  @Get('deployment')
  async testGetDeployment(
    @Query('applicationId') applicationId: string,
    @Query('tenantName') tenantName: string,
    @Query('version') version?: string,
  ) {
    if (!applicationId || !tenantName) {
      throw new HttpException(
        'applicationId and tenantName are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.externalDataService.getDeployment(
      this.getServiceToken(),
      applicationId,
      version,
      tenantName,
    );
  }

  /**
   * Test 3: Get workspace by ID
   * GET /api/fallback-test/workspace?workspaceId=XXX
   */
  @Get('workspace')
  async testGetWorkspace(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) {
      throw new HttpException(
        'workspaceId is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.externalDataService.getWorkspaceById(
      this.getServiceToken(),
      workspaceId,
    );
  }

  /**
   * Test 4: Create application (DRY RUN by default)
   * POST /api/fallback-test/create-application
   * Body: { manifest: {...}, tenantName: "XXX", dryRun?: boolean }
   *
   * WARNING: Set dryRun=false to actually create the application!
   */
  @Post('create-application')
  async testCreateApplication(
    @Body()
    body: {
      manifest: Record<string, unknown>;
      tenantName: string;
      dryRun?: boolean;
    },
  ) {
    if (!body.manifest || !body.tenantName) {
      throw new HttpException(
        'manifest and tenantName are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const dryRun = body.dryRun !== false; // Default to true for safety

    return this.externalDataService.createApplication(
      this.getServiceToken(),
      {
        manifest: body.manifest,
        dryRun,
        forceDeploy: !dryRun,
        triggerOnDeploy: false,
      },
      body.tenantName,
    );
  }

  /**
   * Test 5: Trigger job
   * POST /api/fallback-test/trigger-job
   * Body: { applicationId: "XXX", tenantName: "YYY", input?: {...} }
   *
   * WARNING: This will actually trigger a job!
   */
  @Post('trigger-job')
  async testTriggerJob(
    @Body()
    body: {
      applicationId: string;
      tenantName: string;
      input?: Record<string, unknown>;
    },
  ) {
    if (!body.applicationId || !body.tenantName) {
      throw new HttpException(
        'applicationId and tenantName are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.externalDataService.triggerJob(
      this.getServiceToken(),
      {
        applicationId: body.applicationId,
        input: body.input,
      },
      body.tenantName,
    );
  }

  /**
   * Test 6: Terminate job run
   * POST /api/fallback-test/terminate-job
   * Body: { jobRunId: "XXX", tenantName: "YYY" }
   *
   * WARNING: This will actually terminate a job!
   */
  @Post('terminate-job')
  async testTerminateJob(
    @Body()
    body: {
      deploymentId: string;
      jobRunName: string;
      tenantName: string;
    },
  ) {
    if (!body.deploymentId || !body.jobRunName || !body.tenantName) {
      throw new HttpException(
        'deploymentId, jobRunName and tenantName are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.externalDataService.terminateJobRun(
      this.getServiceToken(),
      body.deploymentId,
      body.jobRunName,
      body.tenantName,
    );

    return {
      message: `Job run ${body.jobRunName} (deployment: ${body.deploymentId}) terminated successfully`,
    };
  }

  /**
   * Test 7: Run the full fallback check (manually trigger the cron job)
   * POST /api/fallback-test/run-fallback-check
   *
   * This triggers the entire runFallbackCheck() logic:
   * 1. Fetches all fallback configs
   * 2. Groups them by source cluster/workspace
   * 3. For each source, fetches job runs and checks if stuck
   * 4. Moves stuck jobs to destination cluster/workspace
   *
   * WARNING: This will execute real actions (create apps, trigger jobs, terminate jobs)!
   */
  @Post('run-fallback-check')
  async testRunFallbackCheck() {
    await this.jobFallbackSchedulerService.runFallbackCheck();
    return {
      message: 'Fallback check completed. Check server logs for details.',
    };
  }

  /**
   * Test 8: Dry-run fallback check - preview what would happen
   * GET /api/fallback-test/preview-fallback
   *
   * Returns a preview of:
   * - All fallback configs
   * - Stuck jobs that would be moved
   * - No actual actions are performed
   */
  @Get('preview-fallback')
  async previewFallback() {
    const token = this.getServiceToken();
    const stuckThresholdMinutes = this.configService.get<number>(
      'JOB_FALLBACK_STUCK_THRESHOLD_MINUTES',
      60,
    );

    // Get all fallback configs
    const configs = await this.fallbackConfigService.findAll();

    if (configs.length === 0) {
      return {
        message: 'No fallback configurations found',
        configs: [],
        stuckJobs: [],
      };
    }

    // Group configs by source
    const groupedSources = new Map<
      string,
      {
        sourceClusterId: string;
        sourceWorkspaceId: string;
        configCount: number;
      }
    >();

    for (const config of configs) {
      const key = `${config.source.clusterId}:${config.source.workspaceId}`;
      if (!groupedSources.has(key)) {
        groupedSources.set(key, {
          sourceClusterId: config.source.clusterId,
          sourceWorkspaceId: config.source.workspaceId,
          configCount: 0,
        });
      }
      groupedSources.get(key)!.configCount++;
    }

    // Find stuck jobs for each source
    const stuckJobs: Array<{
      jobRunId: string;
      jobRunName: string;
      applicationId: string;
      applicationName: string;
      sourceClusterId: string;
      sourceWorkspaceId: string;
      createdAt: number;
      stuckMinutes: number;
      matchingConfigId?: string;
    }> = [];

    for (const source of groupedSources.values()) {
      try {
        const { data: jobRuns } =
          await this.externalDataService.getJobRunsByClusterAndWorkspace(
            token,
            source.sourceClusterId,
            source.sourceWorkspaceId,
            {
              status: [JobRunStatus.RUNNING],
              limit: 100,
            },
          );

        const nowMs = Date.now();

        for (const jobRun of jobRuns) {
          const diffMinutes = (nowMs - jobRun.createdAt) / (1000 * 60);

          if (diffMinutes > stuckThresholdMinutes) {
            // Find matching config
            const matchingConfig = configs.find(
              (c) =>
                c.source.clusterId === source.sourceClusterId &&
                c.source.workspaceId === source.sourceWorkspaceId &&
                (!c.source.jobId || c.source.jobId === jobRun.applicationId),
            );

            stuckJobs.push({
              jobRunId: jobRun.id,
              jobRunName: jobRun.name,
              applicationId: jobRun.applicationId,
              applicationName: jobRun.applicationName,
              sourceClusterId: source.sourceClusterId,
              sourceWorkspaceId: source.sourceWorkspaceId,
              createdAt: jobRun.createdAt,
              stuckMinutes: Math.round(diffMinutes),
              matchingConfigId: matchingConfig?.id,
            });
          }
        }
      } catch {
        // Continue to next source on error
      }
    }

    return {
      summary: {
        totalConfigs: configs.length,
        uniqueSources: groupedSources.size,
        stuckJobsFound: stuckJobs.length,
        stuckThresholdMinutes,
      },
      configs: configs.map((c) => ({
        id: c.id,
        source: c.source,
        destination: c.destination,
      })),
      stuckJobs,
    };
  }
}
