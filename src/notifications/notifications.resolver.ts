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

  @Query(() => [Notification], { 
    description: 'Retrieves all notifications for the currently authenticated user.'
  })
  @UseGuards(JwtAuthGuard)
  async myNotifications(@Context('user') user: User): Promise<Notification[]> {
    return this.notificationsService.getUserNotifications(user.id);
  }

  @Mutation(() => Notification, { 
    description: 'Creates a new notification for the currently authenticated user.'
  })
  @UseGuards(JwtAuthGuard)
  async createNotification(
    @Args('input') input: CreateNotificationInput,
    @Context('user') user: User,
  ): Promise<Notification> {
    return this.notificationsService.createNotification(user.id, input);
  }

  @Mutation(() => Notification, { 
    description: 'Marks a notification as read for the currently authenticated user.'
  })
  @UseGuards(JwtAuthGuard)
  async markNotificationAsRead(
    @Args('id') id: string,
    @Context('user') user: User,
  ): Promise<Notification> {
    return this.notificationsService.markNotificationAsRead(id, user.id);
  }
} 