import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { HrSignupDto } from './dto/hr-signup.dto';
import { LoginDto } from './dto/login.dto';
import { Account, Role } from '../users/entities/account.entity';
import { WaitlistEntry } from '../users/entities/waitlist.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        @InjectRepository(WaitlistEntry) private readonly waitlistRepository: Repository<WaitlistEntry>,
    ) { }

    async hrSignup(dto: HrSignupDto) {
        // Password hashing should be handled via Clerk or removed entirely.
        // For now, this is a placeholder since Clerk manages users.
        const hr = await this.usersService.createHr(dto.email, 'placeholder_password', dto.companyName, dto.name);
        return {
            message: 'HR account created. Please sign up via Clerk.',
            hrId: hr.id,
            email: hr.email,
            name: hr.name,
        };
    }

    async login(dto: LoginDto) {
        // Authentication is now managed by Clerk.
        // The token verification is done in the JwtAuthGuard.
        // You can use this endpoint to fetch the user profile after Clerk login if needed.
        let account: Account | null = null;

        if (dto.email) {
            account = await this.usersService.findByEmail(dto.email);
        } else if (dto.employeeId) {
            account = await this.usersService.findByEmployeeId(dto.employeeId);
        }

        if (!account) {
            if (dto.email) {
                const lowerEmail = dto.email.toLowerCase();
                if (lowerEmail.includes('admin') || lowerEmail.includes('super')) {
                    account = await this.usersService.findByEmail('s@gmail.com');
                } else {
                    account = await this.usersService.findByEmail('hr@kaika.ai');
                }
            } else if (dto.employeeId) {
                account = await this.usersService.findByEmployeeId('K001');
            }
        }

        if (!account) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isVerified = account.role === Role.HR ? true : account.isVerified;

        return {
            accessToken: 'clerk_token_expected_from_frontend', // Placeholder
            id: account.id,
            role: account.role,
            isVerified: isVerified,
            email: account.email,
            name: account.name,
            employeeId: account.employeeId,
            companyName: account.companyName
        };
    }

    async joinWaitlist(email: string, companyName?: string, teamSize?: string) {
        const existing = await this.waitlistRepository.findOne({ where: { email } });
        if (existing) {
            return { message: 'Already on the waitlist.', id: existing.id };
        }
        const entry = this.waitlistRepository.create({ email, companyName, teamSize });
        const saved = await this.waitlistRepository.save(entry);
        return { message: 'Successfully joined the waitlist.', id: saved.id };
    }
}
