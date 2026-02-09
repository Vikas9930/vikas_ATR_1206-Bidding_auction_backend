import { IsEmail, IsString, MinLength, ValidateIf } from 'class-validator';
import { Match } from '../decorators/match.decorator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @MinLength(6, { message: 'Confirm password must be at least 6 characters long' })
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}
