import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByColumn1736928500000 implements MigrationInterface {
  name = 'AddCreatedByColumn1736928500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cluster_fallback_configs" ADD "createdBy" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cluster_fallback_configs" DROP COLUMN "createdBy"`,
    );
  }
}
