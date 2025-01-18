import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class RetrieveForNotificationsDto {
  @IsEmail()
  @IsNotEmpty()
  teacher: string;

  @IsString()
  @IsNotEmpty()
  notification: string;
}
