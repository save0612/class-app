import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { StudentService } from './student.service';
import { SuspendStudentDto } from './dto/student-suspend.dto';

@Controller('api')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post('suspend')
  @HttpCode(HttpStatus.NO_CONTENT)
  async suspendStudent(@Body() suspendDto: SuspendStudentDto) {
    const { student } = suspendDto;
    await this.studentService.suspendStudent(student);
  }
}
