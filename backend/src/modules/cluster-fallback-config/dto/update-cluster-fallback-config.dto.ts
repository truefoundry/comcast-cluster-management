import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  SourceClusterDto,
  DestinationClusterDto,
} from './create-cluster-fallback-config.dto';

export class UpdateClusterFallbackConfigDto {
  @ValidateNested()
  @Type(() => SourceClusterDto)
  @IsOptional()
  source?: SourceClusterDto;

  @ValidateNested()
  @Type(() => DestinationClusterDto)
  @IsOptional()
  destination?: DestinationClusterDto;
}
