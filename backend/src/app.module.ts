import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { SequelizeModule } from '@nestjs/sequelize';
import { join } from 'path';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { ExternalDataModule } from './modules/external-data/index.js';
import { ClusterFallbackConfigModule } from './modules/cluster-fallback-config/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dialect = configService.get<string>('DB_DIALECT', 'sqlite');
        const isProduction = configService.get('NODE_ENV') === 'production';

        const baseConfig = {
          autoLoadModels: true,
          synchronize: false,
          logging: isProduction ? false : console.log,
        };

        if (dialect === 'sqlite') {
          const dataDir = configService.get<string>('DATA_DIR', './data');
          return {
            ...baseConfig,
            dialect: 'sqlite' as const,
            storage: join(dataDir, 'database.sqlite'),
          };
        }

        return {
          ...baseConfig,
          dialect: 'postgres' as const,
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
        };
      },
    }),
    ExternalDataModule,
    ClusterFallbackConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
