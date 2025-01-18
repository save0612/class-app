import { Test, TestingModule } from '@nestjs/testing';
import { TeacherService } from './teacher.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Teacher } from './teacher.entity';
import { Student } from '../student/student.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('TeacherService', () => {
  let service: TeacherService;
  let teacherRepository: Repository<Teacher>;
  let studentRepository: Repository<Student>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherService,
        {
          provide: getRepositoryToken(Teacher),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Student),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            findBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TeacherService>(TeacherService);
    teacherRepository = module.get<Repository<Teacher>>(
      getRepositoryToken(Teacher),
    );
    studentRepository = module.get<Repository<Student>>(
      getRepositoryToken(Student),
    );
  });

  describe('registerStudents', () => {
    it('should register existing students and create new ones', async () => {
      const teacherEmail = 'teacher@example.com';
      const studentEmails = ['student1@example.com', 'student2@example.com'];

      const teacher = { email: teacherEmail, students: [] };
      const existingStudents = [
        { email: 'student1@example.com', suspended: false },
      ];

      // Mocking repository methods
      teacherRepository.findOne = jest.fn().mockResolvedValue(teacher);
      studentRepository.find = jest.fn().mockResolvedValue(existingStudents);
      studentRepository.create = jest
        .fn()
        .mockReturnValue({ email: 'student2@example.com' });
      teacherRepository.save = jest.fn().mockResolvedValue(undefined);

      await service.registerStudents(teacherEmail, studentEmails);

      // Check if studentRepository.create was called for new students
      expect(studentRepository.create).toHaveBeenCalledWith({
        email: 'student2@example.com',
      });

      // Check if teacherRepository.save was called
      expect(teacherRepository.save).toHaveBeenCalled();
    });

    it('should create a new teacher if the teacher does not exist', async () => {
      const teacherEmail = 'newTeacher@example.com';
      const studentEmails = ['student1@example.com'];

      const newTeacher = { email: teacherEmail, students: [] };

      // Mocking repository methods
      teacherRepository.findOne = jest.fn().mockResolvedValue(null); // No teacher found
      teacherRepository.create = jest.fn().mockReturnValue(newTeacher);
      studentRepository.find = jest.fn().mockResolvedValue([]);
      studentRepository.create = jest
        .fn()
        .mockReturnValue({ email: 'student1@example.com' });
      teacherRepository.save = jest.fn().mockResolvedValue(undefined);

      await service.registerStudents(teacherEmail, studentEmails);

      // Check if teacherRepository.create was called to create a new teacher
      expect(teacherRepository.create).toHaveBeenCalledWith({
        email: teacherEmail,
      });

      // Check if teacherRepository.save was called to save the teacher
      expect(teacherRepository.save).toHaveBeenCalled();
    });
  });

  describe('getCommonStudents', () => {
    it('should return common students for multiple teachers', async () => {
      const teacherEmails = ['teacher1@example.com', 'teacher2@example.com'];

      const students1 = [
        { email: 'student1@example.com' },
        { email: 'student2@example.com' },
      ];
      const students2 = [
        { email: 'student2@example.com' },
        { email: 'student3@example.com' },
      ];

      // Mocking repository methods
      teacherRepository.find = jest.fn().mockResolvedValue([
        { email: 'teacher1@example.com', students: students1 },
        { email: 'teacher2@example.com', students: students2 },
      ]);

      const result = await service.getCommonStudents(teacherEmails);

      // Assert that only common students are returned
      expect(result).toEqual(['student2@example.com']);
    });

    it('should throw NotFoundException if any teacher is not found', async () => {
      const teacherEmails = [
        'teacher1@example.com',
        'nonExistentTeacher@example.com',
      ];

      teacherRepository.find = jest
        .fn()
        .mockResolvedValue([{ email: 'teacher1@example.com', students: [] }]);

      await expect(service.getCommonStudents(teacherEmails)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('retrieveForNotifications', () => {
    it('should return recipients based on registered students and mentioned emails', async () => {
      const teacherEmail = 'teacher@example.com';
      const notificationText =
        'Hello @student1@example.com and @student2@example.com';

      const teacher = {
        email: teacherEmail,
        students: [
          { email: 'student1@example.com', suspended: false },
          { email: 'student2@example.com', suspended: false },
        ],
      };

      const mentionedEmails = ['student1@example.com', 'student2@example.com'];
      const mentionedStudents = [
        { email: 'student1@example.com', suspended: false },
        { email: 'student2@example.com', suspended: false },
      ];

      // Mocking repository methods
      teacherRepository.findOne = jest.fn().mockResolvedValue(teacher);
      studentRepository.findBy = jest.fn().mockResolvedValue(mentionedStudents);

      // Mocking extractMentions method
      service['extractMentions'] = jest.fn().mockReturnValue(mentionedEmails);

      const result = await service.retrieveForNotifications(
        teacherEmail,
        notificationText,
      );

      // Assert that the correct recipients are returned
      expect(result.recipients).toEqual([
        'student1@example.com',
        'student2@example.com',
      ]);
    });

    it('should exclude suspended students from the recipients list', async () => {
      const teacherEmail = 'teacher@example.com';
      const notificationText =
        'Hello @student1@example.com and @student2@example.com';

      const teacher = {
        email: teacherEmail,
        students: [
          { email: 'student1@example.com', suspended: false },
          { email: 'student2@example.com', suspended: true }, // Suspended student
        ],
      };

      const mentionedEmails = ['student1@example.com', 'student2@example.com'];
      const mentionedStudents = [
        { email: 'student1@example.com', suspended: false },
        { email: 'student2@example.com', suspended: true }, // Suspended student
      ];

      // Mocking repository methods
      teacherRepository.findOne = jest.fn().mockResolvedValue(teacher);
      studentRepository.findBy = jest.fn().mockResolvedValue(mentionedStudents);

      // Mocking extractMentions method
      service['extractMentions'] = jest.fn().mockReturnValue(mentionedEmails);

      const result = await service.retrieveForNotifications(
        teacherEmail,
        notificationText,
      );

      // Assert that suspended students are excluded from the recipients list
      expect(result.recipients).toEqual(['student1@example.com']);
    });
  });
});
