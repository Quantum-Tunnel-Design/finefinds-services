import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class DashboardMetricsDto {
  @Field(() => Float, { description: 'Total amount from online payments.' })
  onlinePaymentsTotal: number;

  @Field(() => Float, { description: 'Total amount from all payments.' })
  totalPayments: number;

  @Field(() => Int, { description: 'Total number of registered users.' })
  totalUsers: number;

  @Field(() => Int, { description: 'Number of users registered as parents.' })
  parentsRegistered: number;

  @Field(() => Int, { description: 'Number of users registered as vendors.' })
  vendorsRegistered: number;
} 