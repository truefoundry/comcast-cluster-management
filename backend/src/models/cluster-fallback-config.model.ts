import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'cluster_fallback_configs' })
export class ClusterFallbackConfig extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare sourceClusterId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare sourceWorkspaceId: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare sourceJobId: string | null;

  @Column({ type: DataType.STRING, allowNull: false })
  declare destinationClusterId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare destinationWorkspaceId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare destinationWorkspaceFqn: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare createdBy: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
