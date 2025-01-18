import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Teacher } from '../teacher/teacher.entity';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @ManyToMany(() => Teacher, (teacher) => teacher.students)
  teachers?: Teacher[];

  @Column({ default: false })
  suspended: boolean; // Suspended status
}
