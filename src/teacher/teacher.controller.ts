import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { RegisterDto } from './dto/register.dto';
import { CommonStudentsDto } from './dto/common-student.dto';
import { RetrieveForNotificationsDto } from './dto/retrieve-for-notifications.dto';

@Controller('api')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registerStudents(@Body() registerDto: RegisterDto) {
    const { teacher, students } = registerDto;
    await this.teacherService.registerStudents(teacher, students);
  }

  @Get('commonstudents')
  async getCommonStudents(@Query() { teacher }: CommonStudentsDto) {
    const students = await this.teacherService.getCommonStudents(
      [teacher].flat(),
    );
    return { students };
  }

  @Post('retrievefornotifications')
  @HttpCode(HttpStatus.OK)
  async retrieveForNotifications(
    @Body() notificationDto: RetrieveForNotificationsDto,
  ) {
    const { teacher, notification } = notificationDto;
    const result = await this.teacherService.retrieveForNotifications(
      teacher,
      notification,
    );
    return result;
  }
}
