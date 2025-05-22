import { ObjectType, Field } from '@nestjs/graphql';
import { DashboardMetricsDto } from './dashboard-metrics.dto';
import { MonthlyPaymentDataDto } from './monthly-payment-data.dto';
// Type and ValidateNested are for class-validator, not directly needed for GraphQL schema generation
// but can remain for input validation if this DTO were used as an input elsewhere.

@ObjectType()
export class AdminDashboardDataDto {
  @Field(() => DashboardMetricsDto)
  metrics: DashboardMetricsDto;

  @Field(() => [MonthlyPaymentDataDto])
  monthlyPayments: MonthlyPaymentDataDto[];
} 