import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cluster_fallback_configs')
export class ClusterFallbackConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Source cluster information
  @Column()
  sourceClusterId: string;

  @Column()
  sourceWorkspaceId: string;

  @Column({ type: 'varchar', nullable: true })
  sourceJobId: string | null;

  // Destination (fallback) cluster information
  @Column()
  destinationClusterId: string;

  @Column()
  destinationWorkspaceId: string;

  @Column({ type: 'varchar' })
  destinationWorkspaceFqn: string;

  // Created by (TrueFoundry user ID)
  @Column({ type: 'varchar', nullable: true })
  createdBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
