import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    employeeId?: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
