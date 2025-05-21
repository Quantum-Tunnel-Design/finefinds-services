import { Field, InputType } from '@nestjs/graphql';
import { VendorSignUpInput } from './vendor-sign-up.input';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';

@InputType()
export class BulkCreateVendorsInput {
  @Field(() => [VendorSignUpInput])
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => VendorSignUpInput)
  vendors: VendorSignUpInput[];
} 