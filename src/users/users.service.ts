import { Injectable, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, Role } from './entities/account.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
    ) { }

    async onModuleInit() {
        // Seed initial SuperAdmin
        const superAdminExists = await this.accountRepository.findOne({ where: { role: Role.SUPERADMIN } });
        if (!superAdminExists) {
            const salt = await bcrypt.genSalt();
            const hash = await bcrypt.hash('superadmin123', salt);
            const superAdmin = this.accountRepository.create({
                email: 'superadmin@kaikaai.com',
                password: hash,
                role: Role.SUPERADMIN,
                isVerified: true
            });
            await this.accountRepository.save(superAdmin);
            console.log('Seeded default SuperAdmin: superadmin@kaikaai.com / superadmin123');
        }
    }

    async createHr(email: string, passwordHash: string, companyName: string): Promise<Account> {
        const existing = await this.accountRepository.findOne({ where: { email } });
        if (existing) {
            throw new ConflictException('Email already in use');
        }

        const newHr = this.accountRepository.create({
            email,
            password: passwordHash,
            companyName,
            role: Role.HR,
            isVerified: false, // Must be verified by SuperAdmin
        });

        return this.accountRepository.save(newHr);
    }

    async findByEmail(email: string): Promise<Account | null> {
        return this.accountRepository.findOne({ where: { email } });
    }

    async findByEmployeeId(employeeId: string): Promise<Account | null> {
        return this.accountRepository.findOne({ where: { employeeId } });
    }

    async createEmployee(hrId: string, employeeId: string, passwordHash: string): Promise<Account> {
        const existing = await this.findByEmployeeId(employeeId);
        if (existing) {
            throw new ConflictException('Employee ID already in use');
        }

        const hr = await this.accountRepository.findOne({ where: { id: hrId } });
        if (!hr || hr.role !== Role.HR || !hr.isVerified) {
            throw new ConflictException('Invalid HR or HR not verified');
        }

        const employee = this.accountRepository.create({
            employeeId,
            password: passwordHash,
            role: Role.USER,
            isVerified: true, // Employees don't need verification
            hrCreator: hr,
        });

        return this.accountRepository.save(employee);
    }

    async verifyHr(hrId: string): Promise<Account> {
        const hr = await this.accountRepository.findOne({ where: { id: hrId, role: Role.HR } });
        if (!hr) {
            throw new NotFoundException('HR not found');
        }

        hr.isVerified = true;
        return this.accountRepository.save(hr);
    }

    async getPendingHrs(): Promise<Account[]> {
        return this.accountRepository.find({ where: { role: Role.HR, isVerified: false } });
    }
}
