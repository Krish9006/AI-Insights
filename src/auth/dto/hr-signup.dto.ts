import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class HrSignupDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    companyName: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}
