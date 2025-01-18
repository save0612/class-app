import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async suspendStudent(studentEmail: string): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { email: studentEmail },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    student.suspended = true;
    await this.studentRepository.save(student);
  }
}
