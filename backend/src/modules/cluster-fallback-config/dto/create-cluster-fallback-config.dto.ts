import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SourceClusterDto {
  @IsString()
  @IsNotEmpty()
  clusterId: string;

  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsString()
  @IsOptional()
  jobId?: string;
}

export class DestinationClusterDto {
  @IsString()
  @IsNotEmpty()
  clusterId: string;

  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsString()
  @IsNotEmpty()
  workspaceFqn: string;
}

export class CreateClusterFallbackConfigDto {
  @ValidateNested()
  @Type(() => SourceClusterDto)
  source: SourceClusterDto;

  @ValidateNested()
  @Type(() => DestinationClusterDto)
  destination: DestinationClusterDto;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  stuckThresholdMinutes: number;
}
