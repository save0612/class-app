import { IsArray, IsEmail } from 'class-validator';

export class CommonStudentsDto {
  @IsArray()
  @IsEmail({}, { each: true })
  teacher: string[];
}
