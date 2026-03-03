import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { HrSignupDto } from './dto/hr-signup.dto';
import { LoginDto } from './dto/login.dto';
import { Account, Role } from '../users/entities/account.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async hrSignup(dto: HrSignupDto) {
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(dto.password, salt);

        const hr = await this.usersService.createHr(dto.email, hash, dto.companyName);

        return {
            message: 'HR account created. Awaiting SuperAdmin verification.',
            hrId: hr.id,
            email: hr.email,
        };
    }

    async login(dto: LoginDto) {
        let account: Account | null = null;

        if (dto.email) {
            account = await this.usersService.findByEmail(dto.email);
        } else if (dto.employeeId) {
            account = await this.usersService.findByEmployeeId(dto.employeeId);
        }

        if (!account || !account.password) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(dto.password, account.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Role-specific checks
        if (account.role === Role.HR && !account.isVerified) {
            throw new UnauthorizedException('HR Account pending verification');
        }

        const payload = {
            sub: account.id,
            email: account.email,
            employeeId: account.employeeId,
            role: account.role
        };

        return {
            accessToken: this.jwtService.sign(payload),
            role: account.role,
            isVerified: account.isVerified
        };
    }
}
