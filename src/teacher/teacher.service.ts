import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { Student } from '../student/student.entity';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async registerStudents(
    teacherEmail: string,
    studentEmails: string[],
  ): Promise<void> {
    let teacher = await this.teacherRepository.findOne({
      where: { email: teacherEmail },
      relations: ['students'],
    });

    if (!teacher) {
      teacher = this.teacherRepository.create({ email: teacherEmail });
    }

    const existingStudents = await this.studentRepository.find({
      where: { email: In(studentEmails) },
    });

    const existingStudentEmails = existingStudents.map(
      (student) => student.email,
    );

    const newStudentEmails = studentEmails.filter(
      (email) => !existingStudentEmails.includes(email),
    );

    const newStudents = newStudentEmails.map((email) =>
      this.studentRepository.create({ email }),
    );
    if (newStudents.length > 0) {
      if (teacher.students?.length) {
        teacher.students = [...teacher.students, ...newStudents];
      } else {
        teacher.students = newStudents;
      }
    }

    await this.teacherRepository.save(teacher);
  }

  async getCommonStudents(teacherEmails: string[]): Promise<string[]> {
    const teachers = await this.teacherRepository.find({
      where: { email: In(teacherEmails) },
      relations: ['students'],
    });

    if (teachers.length !== teacherEmails.length) {
      throw new NotFoundException('One or more teachers not found');
    }

    let studentEmails = teachers[0].students.map((student) => student.email);

    for (let i = 1; i < teachers.length; i++) {
      const currentTeacherEmails = teachers[i].students.map(
        (student) => student.email,
      );
      studentEmails = studentEmails.filter((email) =>
        currentTeacherEmails.includes(email),
      );
      console.log(`Iteration ${i}: `, studentEmails);
    }

    return studentEmails;
  }

  async retrieveForNotifications(
    teacherEmail: string,
    notificationText: string,
  ): Promise<{ recipients: string[] }> {
    const teacher = await this.teacherRepository.findOne({
      where: { email: teacherEmail },
      relations: ['students'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const registeredStudents = teacher.students.filter(
      (student) => !student.suspended,
    );

    const mentionedEmails = this.extractMentions(notificationText);

    const combinedEmails = [
      ...new Set([
        ...registeredStudents.map((student) => student.email),
        ...mentionedEmails,
      ]),
    ];

    const mentionedStudents = await this.studentRepository.findBy({
      email: In(mentionedEmails),
    });

    const finalRecipients = combinedEmails.filter((email) => {
      const student = mentionedStudents.find((s) => s.email === email);
      return !student || !student.suspended;
    });

    return { recipients: finalRecipients };
  }

  private extractMentions(notificationText: string): string[] {
    const regex = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const matches = [];
    let match;
    while ((match = regex.exec(notificationText)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }
}
