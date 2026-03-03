import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HrSignupDto } from './dto/hr-signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('hr/signup')
    @HttpCode(HttpStatus.CREATED)
    async hrSignup(@Body() signupDto: HrSignupDto) {
        return this.authService.hrSignup(signupDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
}
