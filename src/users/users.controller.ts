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
    @Get('hr/team-stats')
    async getHrStats(@Request() req) {
        return this.usersService.getHrTeamStats(req.user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.HR)
    @Get('employees')
    async getEmployees(@Request() req) {
        const accounts = await this.usersService.getEmployeesByHr(req.user.id);
        return accounts.map((a) => ({
            id: a.id,
            employeeId: a.employeeId,
            role: a.role,
            assessmentCompleted: a.profile?.isAssessmentCompleted ?? false,
        }));
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER, Role.HR, Role.SUPERADMIN)
    @Post('chat')
    async aiCoachingChat(@Request() req, @Body() body: { messages: any[] }) {
        const accountId = req.user.id;
        
        // Ensure there's a conversation to continue
        if (!body.messages || !Array.isArray(body.messages)) {
            return { error: 'Messages array is required' };
        }

        try {
            // Fetch User Profile to construct Context - Fallback to null if not found
            let profile: any = null; // Use any to bypass inference for now or properly import type
            try {
                profile = await this.usersService.getEmployeeProfile(accountId);
            } catch (pError) {
                console.log('Skipping profile context: User has not completed assessment yet.');
            }
            
            const systemPrompt = `You are KaikaAI, a specialized AI Mentor focused EXCLUSIVELY on mental health, career guidance, Ikigai alignment, and emotional well-being.

## SCOPE — ABSOLUTE, NON-NEGOTIABLE RULES:

ALLOWED topics (respond only to these):
- Mental health, stress, anxiety, motivation, burnout
- Career clarity, purpose, passion, professional growth
- Ikigai framework (love, good at, world needs, paid for)
- Emotional support, self-discovery, mindset, resilience
- The user's own profile scores and well-being

STRICTLY FORBIDDEN topics — NEVER answer, explain, or engage with:
- Coding, programming, software, debugging, algorithms
- Mathematics, physics, chemistry, biology, science
- History, geography, politics, economics
- General trivia, sports, movies, recipes, news, current events
- Any factual knowledge question unrelated to mental health or career

IF THE USER ASKS ANYTHING OUTSIDE THE ALLOWED TOPICS:
You MUST respond with EXACTLY this templated message, with no variation:
"That's outside my area of expertise! I'm here specifically for your mental wellness, career clarity, and Ikigai journey. Is there something about your well-being or purpose you'd like to explore today? 🌱"

Do NOT attempt to answer the off-topic question even partially. Do NOT apologize extensively. Use ONLY the template above.

## RESPONSE STYLE RULES:
3. Keep responses CONCISE (1-3 paragraphs max). Do not ramble.
4. GREETINGS: For simple 'Hi', 'Hello', or 'How are you', provide a strictly ONE-LINE enthusiastic response.
5. Precision & Depth: Only provide detailed analysis when the user shares a specific, deep-seated problem.
6. Be conversational and empathetic. Do not sound like a robot. 

${profile ? `## USER'S CONFIDENTIAL IKIGAI PROFILE (use organically to personalize advice):

IKIGAI ALIGNMENT SCORES:
- Passion (Love): ${profile.computedScores?.love || 0}%
- Profession (Good At): ${profile.computedScores?.goodAt || 0}%
- Mission (World Needs): ${profile.computedScores?.worldNeeds || 0}%
- Vocation (Paid For): ${profile.computedScores?.paidFor || 0}%

USER'S DEEP THOUGHTS:
- What they love: ${profile.freeTextAnswers?.t1 || 'N/A'}
- What they are good at: ${profile.freeTextAnswers?.t2 || 'N/A'}
- What problem they want to solve in the world: ${profile.freeTextAnswers?.t3 || 'N/A'}
- Their most monetizable skill: ${profile.freeTextAnswers?.t4 || 'N/A'}
- What they would do if money didn't matter: ${profile.freeTextAnswers?.t5 || 'N/A'}
` : 'The user has not yet shared their Ikigai profile. Encourage them to complete their assessment, but support their current mental state as best you can.'}

Do not list the profile back to them. Keep it natural. Begin helping them.`;

            // Prepare messages payload for Groq
            const payload = {
                model: "llama-3.3-70b-versatile", 
                messages: [
                    { role: "system", content: systemPrompt },
                    ...body.messages
                ],
                temperature: 0.7,
                max_tokens: 1024
            };

            const groqKey = process.env.GROQ_API_KEY;
            if (!groqKey) {
                throw new Error('GROQ_API_KEY is missing from environment');
            }

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${groqKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Groq Response Error Details:', errorData); // DEBUG
                throw new Error(`Groq API error: ${errorData}`);
            }

            const data = await response.json();
            return {
                reply: data.choices[0].message.content
            };

        } catch (error) {
            console.error('CRITICAL CHAT ERROR:', error);
            return { error: 'KaikaAI is currently meditating and unavailable. Please try again in 30 seconds.' };
        }
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER, Role.HR, Role.SUPERADMIN) // Anyone can fill this out
    @Post('profile')
    async saveEmployeeProfile(@Request() req, @Body() profileData: any) {
        const accountId = req.user.id;
        return this.usersService.saveEmployeeProfile(accountId, profileData);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER, Role.HR, Role.SUPERADMIN)
    @Get('profile/my')
    async getMyProfile(@Request() req) {
        const accountId = req.user.id;
        try {
            return await this.usersService.getEmployeeProfile(accountId);
        } catch (error) {
            return { isAssessmentCompleted: false };
        }
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    @Get('dashboard-stats')
    async getDashboardStats(@Request() req) {
        return this.usersService.getDashboardStats(req.user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    @Get('mood-checkin/today')
    async getTodayMoodCheckin(@Request() req) {
        return this.usersService.getTodayMoodCheckin(req.user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER)
    @Post('mood-checkin')
    async saveTodayMoodCheckin(
        @Request() req,
        @Body() body: { answers: Record<string, number>; note?: string | null },
    ) {
        return this.usersService.saveTodayMoodCheckin(req.user.id, body);
    }
}
