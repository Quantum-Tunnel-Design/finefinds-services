import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/models/user.model';
import { Notification } from './models/notification.model';
import { CreateNotificationInput } from './dto/create-notification.input';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [Notification])
  @UseGuards(JwtAuthGuard)
  async myNotifications(@Context('user') user: User): Promise<Notification[]> {
    return this.notificationsService.getUserNotifications(user.id);
  }

  @Mutation(() => Notification)
  @UseGuards(JwtAuthGuard)
  async createNotification(
    @Args('input') input: CreateNotificationInput,
    @Context('user') user: User,
  ): Promise<Notification> {
    return this.notificationsService.createNotification(user.id, input);
  }

  @Mutation(() => Notification)
  @UseGuards(JwtAuthGuard)
  async markNotificationAsRead(
    @Args('id') id: string,
    @Context('user') user: User,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, user.id);
  }
} 