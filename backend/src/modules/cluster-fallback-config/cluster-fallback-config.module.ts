import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClusterFallbackConfigController } from './cluster-fallback-config.controller.js';
import { ClusterFallbackConfigService } from './cluster-fallback-config.service.js';
import { FallbackTestController } from './fallback-test.controller.js';
import { JobFallbackSchedulerService } from './job-fallback-scheduler.service.js';
import { ClusterFallbackConfig } from '../../models/index.js';
import { ExternalDataModule } from '../external-data/index.js';

@Module({
  imports: [
    SequelizeModule.forFeature([ClusterFallbackConfig]),
    ExternalDataModule,
  ],
  controllers: [ClusterFallbackConfigController, FallbackTestController],
  providers: [ClusterFallbackConfigService, JobFallbackSchedulerService],
  exports: [ClusterFallbackConfigService],
})
export class ClusterFallbackConfigModule {}
