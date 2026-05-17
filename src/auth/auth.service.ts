import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { HrSignupDto } from './dto/hr-signup.dto';
import { LoginDto } from './dto/login.dto';
import { Account, Role } from '../users/entities/account.entity';
import { WaitlistEntry } from '../users/entities/waitlist.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        @InjectRepository(WaitlistEntry) private readonly waitlistRepository: Repository<WaitlistEntry>,
    ) { }

    async hrSignup(dto: HrSignupDto) {
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(dto.password, salt);
        const hr = await this.usersService.createHr(dto.email, hash, dto.companyName, dto.name);
        return {
            message: 'HR account created. Awaiting SuperAdmin verification.',
            hrId: hr.id,
            email: hr.email,
            name: hr.name,
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

        if (account.role === Role.HR && !account.isVerified) {
            throw new UnauthorizedException('HR Account pending verification');
        }

        const payload = {
            sub: account.id,
            email: account.email,
            employeeId: account.employeeId,
            name: account.name,
            role: account.role
        };

        return {
            accessToken: this.jwtService.sign(payload),
            id: account.id,
            role: account.role,
            isVerified: account.isVerified,
            email: account.email,
            name: account.name,
            employeeId: account.employeeId,
            companyName: account.companyName
        };
    }

    async joinWaitlist(email: string, companyName?: string, teamSize?: string) {
        // Avoid duplicate entries for the same email
        const existing = await this.waitlistRepository.findOne({ where: { email } });
        if (existing) {
            return { message: 'Already on the waitlist.', id: existing.id };
        }
        const entry = this.waitlistRepository.create({ email, companyName, teamSize });
        const saved = await this.waitlistRepository.save(entry);
        return { message: 'Successfully joined the waitlist.', id: saved.id };
    }
}
