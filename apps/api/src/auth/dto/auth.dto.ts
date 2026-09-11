import { IsEmail, IsString, IsUUID, Length } from 'class-validator';

export class LoginDto {
  @IsUUID('4')
  organizationId!: string;

  @IsEmail()
  @Length(3, 320)
  email!: string;

  @IsString()
  @Length(8, 256)
  password!: string;
}
