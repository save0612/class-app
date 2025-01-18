import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { Teacher } from './teacher.entity';
import { Student } from '../student/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Teacher, Student])],
  providers: [TeacherService],
  controllers: [TeacherController],
})
export class TeacherModule {}
