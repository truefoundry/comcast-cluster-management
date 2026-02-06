import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { ConfigService } from '@nestjs/config'; // Uncomment when using TypeORM
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature modules
import { ExternalDataModule } from './modules/external-data';
import { ClusterFallbackConfigModule } from './modules/cluster-fallback-config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'], // Exclude API routes from static serving
    }),
    // ============================================================
    // DATABASE CONFIGURATION (Commented out for JSON file storage)
    // Uncomment when ready to use PostgreSQL
    // ============================================================
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     type: 'postgres',
    //     host: configService.get('DB_HOST', 'localhost'),
    //     port: configService.get<number>('DB_PORT', 5432),
    //     username: configService.get('DB_USERNAME', 'admin'),
    //     password: configService.get('DB_PASSWORD', 'admin123'),
    //     database: configService.get('DB_NAME', 'cluster_management'),
    //     entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //     migrations: [__dirname + '/migrations/*{.ts,.js}'],
    //     synchronize: false, // Always run migrations manually
    //     migrationsRun: false, // Don't auto-run migrations on startup
    //     logging: configService.get('NODE_ENV') !== 'production',
    //   }),
    // }),
    // Feature modules
    ExternalDataModule,
    ClusterFallbackConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
