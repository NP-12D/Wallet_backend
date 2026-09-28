import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user1', minLength: 1, maxLength: 40 })
  @IsNotEmpty()
  @IsString()
  @Length(1, 40)
  username!: string;

  @ApiProperty({ example: 'user1@example.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 6, maxLength: 80 })
  @IsNotEmpty()
  @IsString()
  @Length(6, 80)
  password!: string;
}
