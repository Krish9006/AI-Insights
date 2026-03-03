import { Controller, Post, Get, Put, Body, UseGuards, Request, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './entities/account.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.HR)
    @Post('employee')
    async createEmployee(@Request() req, @Body() createEmployeeDto: CreateEmployeeDto) {
        const hrId = req.user.id;

        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(createEmployeeDto.password, salt);

        const employee = await this.usersService.createEmployee(
            hrId,
            createEmployeeDto.employeeId,
            hash
        );

        return {
            message: 'Employee account created successfully',
            employeeId: employee.employeeId
        };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN)
    @Get('pending-hrs')
    async getPendingHrs() {
        return this.usersService.getPendingHrs();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN)
    @Put('verify-hr/:id')
    async verifyHr(@Param('id') id: string) {
        const hr = await this.usersService.verifyHr(id);
        return {
            message: 'HR verified successfully',
            hrId: hr.id,
            email: hr.email
        };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.HR)
    @Get('employees')
    async getEmployees(@Request() req) {
        return this.usersService.getEmployeesByHr(req.user.id);
    }
}
