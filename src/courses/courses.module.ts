import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
// import { CoursesResolver } from './courses.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    CoursesService,
    // CoursesResolver
  ],
  exports: [CoursesService],
})
export class CoursesModule { } 