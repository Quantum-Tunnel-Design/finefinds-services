import { ObjectType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class OperationStatusDto {
  @ApiProperty()
  @Field()
  success: boolean;

  @ApiProperty({ nullable: true })
  @Field({ nullable: true })
  message?: string;
} 