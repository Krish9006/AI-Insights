import { Controller, Post, Get, Put, Delete, Body, UseGuards, Request, Param, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, Account } from './entities/account.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.HR)
    @Post('employee')
    async createEmployee(@Request() req, @Body() createEmployeeDto: CreateEmployeeDto) {
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(createEmployeeDto.password, salt);
        const employee = await this.usersService.createEmployee(req.user.id, createEmployeeDto.employeeId, hash, createEmployeeDto.name, createEmployeeDto.department, createEmployeeDto.careerStage) as Account;
        return { message: 'Employee created', employeeId: employee.employeeId, name: employee.name };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN)
    @Get('pending-hrs')
    async getPendingHrs() { return this.usersService.getPendingHrs(); }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN)
    @Put('verify-hr/:id')
    async verifyHr(@Param('id') id: string) { return this.usersService.verifyHr(id); }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.HR)
    @Get('hr/team-stats')
    async getHrStats(@Request() req) { return this.usersService.getHrTeamStats(req.user.id); }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.HR)
    @Get('hr/session-intelligence')
    async getSessionIntelligence(@Request() req) { return this.usersService.getHrSessionIntelligence(req.user.id); }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.HR)
    @Get('employees')
    async getEmployees(@Request() req) {
        const accounts = await this.usersService.getEmployeesByHr(req.user.id);
        return accounts.map((a) => ({ id: a.id, name: a.name, employeeId: a.employeeId, role: a.role, assessmentCompleted: a.isAssessmentCompleted ?? false }));
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.HR)
    @Get('hr/pathways')
    async getHrPathways(@Request() req) { return this.usersService.getPathwaysForHr(req.user.id); }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.HR)
    @Post('pathways')
    async createPathway(@Request() req, @Body() body: any) { 
        // Note: HR can create pathways for their department/company
        return this.usersService.createPathway(req.user.id, body); 
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.HR)
    @Delete('pathways/:id')
    async deletePathway(@Request() req, @Param('id') id: string) { 
        return this.usersService.deletePathway(req.user.id, id); 
    }

    @UseGuards(JwtAuthGuard)
    @Post('profile')
    async saveProfile(@Request() req, @Body() data: any) { return this.usersService.saveEmployeeProfile(req.user.id, data); }

    @UseGuards(JwtAuthGuard)
    @Get('profile/my')
    async getMyProfile(@Request() req) {
        try { return await this.usersService.getEmployeeProfile(req.user.id); } 
        catch (e) { return { isAssessmentCompleted: false }; }
    }

    @UseGuards(JwtAuthGuard)
    @Get('dashboard-stats')
    async getStats(@Request() req) { return this.usersService.getDashboardStats(req.user.id); }

    @UseGuards(JwtAuthGuard)
    @Get('benchmarks')
    async getBenchmarks(@Request() req) { return this.usersService.getCommunityBenchmarks(req.user.id); }

    @UseGuards(JwtAuthGuard)
    @Get('purpose-twins')
    async getTwins(@Request() req) { return this.usersService.getPurposeTwins(req.user.id); }

    @UseGuards(JwtAuthGuard)
    @Get('stories')
    async getStories(@Request() req) { return this.usersService.getGrowthStories(req.user.id); }

    @UseGuards(JwtAuthGuard)
    @Post('stories')
    async createStory(@Request() req, @Body() body: any) { return this.usersService.createGrowthStory(req.user.id, body.content, body.isAnonymous); }

    @UseGuards(JwtAuthGuard)
    @Post('chat')
    async getAiResponse(@Request() req, @Body() body: any, @Res() res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        await this.usersService.getAiCoachingResponse(req.user.id, body.messages, res);
    }

    @UseGuards(JwtAuthGuard)
    @Post('dm/send')
    async sendDM(@Request() req, @Body() body: any) { return this.usersService.sendDirectMessage(req.user.id, body.receiverId, body.content); }

    @UseGuards(JwtAuthGuard)
    @Get('dm/:otherId')
    async getDMs(@Request() req, @Param('otherId') id: string) { return this.usersService.getDirectMessages(req.user.id, id); }



    @UseGuards(JwtAuthGuard)
    @Get('mood-checkin/history')
    async getMoodHistory(@Request() req) { return this.usersService.getMoodHistory(req.user.id); }

    @UseGuards(JwtAuthGuard)
    @Get('insights')
    async getInsights(@Request() req) { return this.usersService.getPersonalizedInsights(req.user.id); }

    @UseGuards(JwtAuthGuard)
    @Get('chat/history')
    async getChatHistory(@Request() req) { return this.usersService.getChatSessions(req.user.id); }

    @UseGuards(JwtAuthGuard)
    @Get('chat/session/:id')
    async getChatSession(@Param('id') id: string) { return this.usersService.getChatSession(id); }

    @UseGuards(JwtAuthGuard)
    @Post('chat/session')
    async saveChatSession(@Request() req, @Body() body: any) { return this.usersService.saveChatSession(req.user.id, body); }

    @UseGuards(JwtAuthGuard)
    @Delete('chat/session/:id')
    async deleteChatSession(@Param('id') id: string) { await this.usersService.deleteChatSession(id, ""); return { success: true }; }

    @UseGuards(JwtAuthGuard)
    @Put('chat/rename/:id')
    async renameChatSession(@Param('id') id: string, @Body() body: any) { 
        return this.usersService.renameChatSession(id, body.title); 
    }

    @UseGuards(JwtAuthGuard)
    @Get('daily-prompt')
    async getDailyPrompt(@Request() req) { return this.usersService.getDailyPrompt(req.user.id); }

    @UseGuards(JwtAuthGuard)
    @Get('mood-checkin/today')
    async getMoodToday(@Request() req) { return this.usersService.getTodayMoodCheckin(req.user.id); }

    @UseGuards(JwtAuthGuard)
    @Post('streak/update')
    async updateStreak(@Request() req) { return this.usersService.updateStreak(req.user.id); }

    @UseGuards(JwtAuthGuard)
    @Post('complete-tour')
    async completeTour(@Request() req) { return this.usersService.completeTour(req.user.id); }

    @UseGuards(JwtAuthGuard)
    @Post('mood-checkin')
    async saveMood(@Request() req, @Body() body: any) { return this.usersService.saveTodayMoodCheckin(req.user.id, body); }

    @UseGuards(JwtAuthGuard)
    @Get('pathways')
    async getPathways(@Request() req) { return this.usersService.getPathwaysForUser(req.user.id); }

    @UseGuards(JwtAuthGuard)
    @Get('pathways/:id/advice')
    async getPathwayAdvice(@Request() req, @Param('id') id: string) { return this.usersService.getPathwayAdvice(req.user.id, id); }

    @UseGuards(JwtAuthGuard)
    @Post('pathways/:id/apply')
    async applyToPathway(@Request() req, @Param('id') id: string) { return this.usersService.applyToPathway(req.user.id, id); }

    @UseGuards(JwtAuthGuard)
    @Post('resume')
    async saveResume(@Request() req, @Body() body: any) { 
        return this.usersService.saveResume(req.user.id, body.resumeText, body.resumeFileName, body.resumeFileBase64); 
    }
}
