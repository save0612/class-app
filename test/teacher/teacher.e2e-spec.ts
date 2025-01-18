import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Teacher } from '../../src/teacher/teacher.entity';
import { Student } from '../../src/student/student.entity';
import { Repository } from 'typeorm';

describe('TeacherController (e2e)', () => {
  let app: INestApplication;
  let teacherRepository: Repository<Teacher>;
  let studentRepository: Repository<Student>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    teacherRepository = moduleFixture.get<Repository<Teacher>>(
      getRepositoryToken(Teacher),
    );
    studentRepository = moduleFixture.get<Repository<Student>>(
      getRepositoryToken(Student),
    );

    await app.init();
  });

  beforeEach(async () => {
    // Cleanup before each test
  });

  it('should register students to a teacher (POST /api/register)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/register')
      .send({
        teacher: 'teacherken@gmail.com',
        students: ['studentjon@gmail.com', 'studenthon@gmail.com'],
      })
      .expect(204); // No content on success

    // Verify teacher-student relationships
    const teacherWithStudents = await teacherRepository.findOne({
      where: { email: 'teacherken@gmail.com' },
      relations: ['students'],
    });

    expect(teacherWithStudents.students.length).toBe(2);
    expect(teacherWithStudents.students[0].email).toBe('studentjon@gmail.com');
    expect(teacherWithStudents.students[1].email).toBe('studenthon@gmail.com');
  });

  it('should retrieve common students (GET /api/commonstudents)', async () => {
    // Create mock teachers
    const teacher1 = await teacherRepository.save({
      email: 'teacherken2@gmail.com',
    });
    const teacher2 = await teacherRepository.save({
      email: 'teacherjoe@gmail.com',
    });

    // Create mock students
    const student1 = await studentRepository.save({
      email: 'commonstudent1@gmail.com',
    });
    const student2 = await studentRepository.save({
      email: 'commonstudent2@gmail.com',
    });
    const student3 = await studentRepository.save({
      email: 'studentonlyunderken@gmail.com',
    });

    // Register students to teachers
    teacher1.students = [student1, student2, student3];
    teacher2.students = [student1, student2];
    await teacherRepository.save([teacher1, teacher2]);

    const response = await request(app.getHttpServer())
      .get(
        '/api/commonstudents?teacher=teacherken2@gmail.com&teacher=teacherjoe@gmail.com',
      )
      .expect(200);

    expect(response.body.students).toEqual([
      'commonstudent1@gmail.com',
      'commonstudent2@gmail.com',
    ]);
  });

  it('should suspend a student (POST /api/suspend)', async () => {
    // Create mock student
    const student = await studentRepository.save({
      email: 'studentmary@gmail.com',
    });

    // Suspend the student
    await request(app.getHttpServer())
      .post('/api/suspend')
      .send({ student: 'studentmary@gmail.com' })
      .expect(204); // No content on success

    // Check if the student is suspended
    const suspendedStudent = await studentRepository.findOne({
      where: { email: 'studentmary@gmail.com' },
    });

    expect(suspendedStudent.suspended).toBe(true);
  });

  it('should retrieve students eligible for notifications (POST /api/retrievefornotifications)', async () => {
    // Create mock teacher
    const teacher = await teacherRepository.save({
      email: 'teacherken3@gmail.com',
    });

    // Create mock students
    const student1 = await studentRepository.save({
      email: 'studentbob@gmail.com',
    });
    const student2 = await studentRepository.save({
      email: 'studentagnes@gmail.com',
    });
    const student3 = await studentRepository.save({
      email: 'studentmiche@gmail.com',
    });

    // Register students to teacher
    teacher.students = [student1, student2];
    await teacherRepository.save(teacher);

    // Send a notification with @mentions
    const response = await request(app.getHttpServer())
      .post('/api/retrievefornotifications')
      .send({
        teacher: 'teacherken3@gmail.com',
        notification:
          'Hello students! @studentagnes@gmail.com @studentmiche@gmail.com',
      })
      .expect(200);

    expect(response.body.recipients).toEqual([
      'studentbob@gmail.com',
      'studentagnes@gmail.com',
      'studentmiche@gmail.com',
    ]);
  });

  afterAll(async () => {
    await app.close();
  });
});
