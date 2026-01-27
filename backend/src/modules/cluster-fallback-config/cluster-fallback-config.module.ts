import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { ClusterFallbackConfigController } from './cluster-fallback-config.controller';
import { ClusterFallbackConfigService } from './cluster-fallback-config.service';
import { FallbackTestController } from './fallback-test.controller';
import { JobFallbackSchedulerService } from './job-fallback-scheduler.service';
// import { ClusterFallbackConfig } from '../../entities';
import { ExternalDataModule } from '../external-data';

@Module({
  imports: [
    // Uncomment when ready to use PostgreSQL:
    // TypeOrmModule.forFeature([ClusterFallbackConfig]),
    ExternalDataModule,
  ],
  controllers: [ClusterFallbackConfigController, FallbackTestController],
  providers: [ClusterFallbackConfigService, JobFallbackSchedulerService],
  exports: [ClusterFallbackConfigService],
})
export class ClusterFallbackConfigModule {}
