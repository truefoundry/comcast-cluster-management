import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1736927400000 implements MigrationInterface {
  name = 'InitialSchema1736927400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create users table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "name" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )`,
    );

    // Create user_cluster_access table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_cluster_access" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "clusterId" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_f51b12a24657912e79fe2588b00" UNIQUE ("userId", "clusterId"),
        CONSTRAINT "PK_76bb108eddbaea7b817f77cab2d" PRIMARY KEY ("id")
      )`,
    );

    // Create user_workspace_access table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_workspace_access" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "workspaceId" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_81308ff3d2df0558719466bb50b" UNIQUE ("userId", "workspaceId"),
        CONSTRAINT "PK_b5165f97e49c3ba047484640c6c" PRIMARY KEY ("id")
      )`,
    );

    // Create cluster_fallback_configs table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "cluster_fallback_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sourceClusterId" character varying NOT NULL,
        "sourceWorkspaceId" character varying NOT NULL,
        "sourceJobId" character varying,
        "destinationClusterId" character varying NOT NULL,
        "destinationWorkspaceId" character varying NOT NULL,
        "createdById" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_14e9328113aabe8c24633c454ba" PRIMARY KEY ("id")
      )`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "user_cluster_access" 
       ADD CONSTRAINT "FK_a0cff377e4163855a1b8911f559" 
       FOREIGN KEY ("userId") REFERENCES "users"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "user_workspace_access" 
       ADD CONSTRAINT "FK_5fc60af2e0df60ce2a9c59e8478" 
       FOREIGN KEY ("userId") REFERENCES "users"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "cluster_fallback_configs" 
       ADD CONSTRAINT "FK_6b640ad58dd8a64e3ed89b8c3cc" 
       FOREIGN KEY ("createdById") REFERENCES "users"("id") 
       ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "cluster_fallback_configs" DROP CONSTRAINT IF EXISTS "FK_6b640ad58dd8a64e3ed89b8c3cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_workspace_access" DROP CONSTRAINT IF EXISTS "FK_5fc60af2e0df60ce2a9c59e8478"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_cluster_access" DROP CONSTRAINT IF EXISTS "FK_a0cff377e4163855a1b8911f559"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "cluster_fallback_configs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_workspace_access"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_cluster_access"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
