import { Injectable, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, IsNull } from 'typeorm';
import { Account, Role } from './entities/account.entity';
import { DailyMoodCheckin } from './entities/daily-mood-checkin.entity';
import { ChatSession } from './entities/chat-session.entity';
import { Pathway } from './entities/pathway.entity';
import { DirectMessage } from './entities/direct-message.entity';
import { GrowthStory } from './entities/growth-story.entity';
import * as bcrypt from 'bcrypt';

function utcDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function utcCalendarDaysBetween(aYmd: string, bYmd: string): number {
  const [ay, am, ad] = aYmd.split('-').map(Number);
  const [by, bm, bd] = bYmd.split('-').map(Number);
  const aMs = Date.UTC(ay, am - 1, ad);
  const bMs = Date.UTC(by, bm - 1, bd);
  return Math.round((aMs - bMs) / (24 * 60 * 60 * 1000));
}

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectRepository(Account) private readonly accountRepository: Repository<Account>,
        @InjectRepository(DailyMoodCheckin) private readonly dailyMoodRepository: Repository<DailyMoodCheckin>,
        @InjectRepository(ChatSession) private readonly chatSessionRepository: Repository<ChatSession>,
        @InjectRepository(Pathway) private readonly pathwayRepository: Repository<Pathway>,
        @InjectRepository(DirectMessage) private readonly dmRepository: Repository<DirectMessage>,
        @InjectRepository(GrowthStory) private readonly storyRepository: Repository<GrowthStory>,
    ) { }

    async onModuleInit() {
        const adminEmail = process.env.SUPERADMIN_EMAIL || 's@gmail.com';
        const adminPassword = process.env.SUPERADMIN_PASSWORD || '123';
        let superAdmin = await this.accountRepository.findOne({ where: { role: Role.SUPERADMIN } });
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(adminPassword, salt);
        if (!superAdmin) {
            superAdmin = this.accountRepository.create({ email: adminEmail, password: hash, role: Role.SUPERADMIN, isVerified: true, companyName: 'KaikaAI Labs' });
            await this.accountRepository.save(superAdmin);
        } else {
            superAdmin.companyName = 'KaikaAI Labs';
            await this.accountRepository.save(superAdmin);
        }

        const hrEmail = 'hr@kaika.ai';
        let defaultHr = await this.accountRepository.findOne({ where: { email: hrEmail } });
        if (!defaultHr) {
            defaultHr = this.accountRepository.create({ 
                email: hrEmail, name: 'Sarah Chen', password: hash, 
                role: Role.HR, isVerified: true, companyName: 'KaikaAI Labs' 
            });
            await this.accountRepository.save(defaultHr);
        }

        const employeeIds = ['K001', 'K002', 'K003', 'K004', 'K005'];
        const names = ['Alex Rivera', 'Maya Gupta', 'Jordan Smith', 'Dr. Elena Vance', 'Sam Wilson'];
        const depts = ['Engineering', 'Product', 'Sales', 'Management', 'Engineering'];

        for (let i = 0; i < employeeIds.length; i++) {
            let emp = await this.accountRepository.findOne({ where: { employeeId: employeeIds[i] } });
            if (!emp) {
                emp = this.accountRepository.create({
                    employeeId: employeeIds[i], name: names[i], password: hash,
                    role: Role.USER, isVerified: true, companyName: 'KaikaAI Labs',
                    department: depts[i], careerStage: 'Mid-Level', hrCreator: defaultHr,
                    isAssessmentCompleted: true,
                    mentalHealthScore: 70 + Math.floor(Math.random() * 20),
                    streakDays: 5 + i,
                    reflectionCount: 10 + i,
                    computedScores: {
                        love: 60 + Math.floor(Math.random() * 30),
                        goodAt: 70 + Math.floor(Math.random() * 20),
                        worldNeeds: 50 + Math.floor(Math.random() * 40),
                        paidFor: 80 + Math.floor(Math.random() * 20)
                    }
                });
                await this.accountRepository.save(emp);

                const p1 = this.pathwayRepository.create({
                    title: 'Senior Developer Track',
                    type: 'Job', alignment: 'Profession',
                    desc: 'A Fast-track internal promotion pathway designed for elite engineers.',
                    assignedTo: emp, hrCreator: defaultHr
                });
                await this.pathwayRepository.save(p1);
            }
        }

        // SEED: General Company Pathways (Visible to all in the same company)
        const generalPathways = [
            { title: 'Leadership Excellence Program', type: 'Mentorship', alignment: 'Mission', desc: 'A 6-month elite mentorship program with senior leadership for high-potential pathfinders.' },
            { title: 'Sustainability Innovation Project', type: 'Project', alignment: 'WorldNeeds', desc: 'Join the cross-departmental task force focusing on carbon-neutral technology initiatives.' },
            { title: 'Advanced Ikigai Mastery', type: 'Learning', alignment: 'Passion', desc: 'Deep dive into the philosophy of purposeful work and strategic life design.' }
        ];

        for (const gp of generalPathways) {
            const exists = await this.pathwayRepository.findOne({ where: { title: gp.title, hrCreator: { id: defaultHr.id } } });
            if (!exists) {
                const p = this.pathwayRepository.create({ ...gp, hrCreator: defaultHr });
                await this.pathwayRepository.save(p);
            }
        }

        // DATABASE REPAIR: Fix missing companyName for ALL users in this environment
        const allUsers = await this.accountRepository.find();
            
        for (const u of allUsers) {
            u.companyName = 'KaikaAI Labs';
            u.isAssessmentCompleted = true; // Auto-complete for dev to show twins
            if (!u.computedScores) {
                u.computedScores = { love: 75, goodAt: 80, worldNeeds: 70, paidFor: 85 };
            }
            await this.accountRepository.save(u);
        }
    }

    async createHr(email: string, passwordHash: string, companyName: string, name: string) {
        const existing = await this.accountRepository.findOne({ where: { email } });
        if (existing) throw new ConflictException('Email already in use');
        const hr = this.accountRepository.create({ email, password: passwordHash, companyName, name, role: Role.HR, isVerified: false });
        return this.accountRepository.save(hr);
    }

    async findByEmail(email: string) { return this.accountRepository.findOne({ where: { email } }); }
    async findById(id: string) { return this.accountRepository.findOne({ where: { id } }); }
    async findByEmployeeId(id: string) { return this.accountRepository.findOne({ where: { employeeId: id } }); }

    async createEmployee(hrId: string, employeeId: string, passwordHash: string, name: string, department: string, careerStage: string) {
        const existing = await this.findByEmployeeId(employeeId);
        if (existing) throw new ConflictException('Employee ID exists');
        const hr = await this.findById(hrId);
        if (!hr) throw new NotFoundException('HR not found');
        
        const emp = this.accountRepository.create({ 
            employeeId, password: passwordHash, name, 
            role: Role.USER, isVerified: true, 
            hrCreator: hr, 
            companyName: hr.companyName, // INHERIT COMPANY NAME
            department, careerStage 
        });
        return this.accountRepository.save(emp);
    }

    async verifyHr(hrId: string) {
        const hr = await this.accountRepository.findOne({ where: { id: hrId, role: Role.HR } });
        if (!hr) throw new NotFoundException('HR not found');
        hr.isVerified = true;
        return this.accountRepository.save(hr);
    }

    async getPendingHrs() { return this.accountRepository.find({ where: { role: Role.HR, isVerified: false } }); }

    async getEmployeesByHr(hrId: string) {
        return this.accountRepository.find({ where: { hrCreator: { id: hrId }, role: Role.USER } });
    }

    async saveEmployeeProfile(accountId: string, data: any) {
        const account = await this.accountRepository.findOne({ where: { id: accountId } });
        if (!account) throw new NotFoundException('Account not found');
        Object.assign(account, { ...data, isAssessmentCompleted: true, mentalHealthScore: data.mentalHealthScore || 75 });
        return this.accountRepository.save(account);
    }

    async getEmployeeProfile(accountId: string) {
        const account = await this.accountRepository.findOne({ where: { id: accountId } });
        if (!account) throw new NotFoundException('Account missing');
        return account;
    }

    async completeTour(accountId: string) {
        // hasCompletedTour removed in simplified version
    }

    async getDashboardStats(accountId: string) {
        const p = await this.accountRepository.findOne({ where: { id: accountId } });
        const count = await this.accountRepository.count({ where: { role: Role.USER } });
        return { streakDays: p?.streakDays || 0, reflectionCount: p?.reflectionCount || 0, clarityScore: p?.mentalHealthScore || 0, activeCommunityCount: count || 242 };
    }

    async getCommunityBenchmarks(userId: string) {
        const user = await this.accountRepository.findOne({ where: { id: userId } });
        if (!user) return null;
        const mood = await this.getTodayMoodCheckin(userId) as any;
        const peers = await this.accountRepository.count({ where: { role: Role.USER, department: user.department } });
        const myMoodScore = mood.completed ? mood.moodScore : 72;
        const peerAvg = 68;
        return { myMood: myMoodScore, peerCount: peers > 1 ? peers - 1 : 242, sector: user.department || 'Creative Technology', moodComparison: myMoodScore > peerAvg ? 'Above Average' : 'Steady focus', burnoutComparison: 'Healthy' };
    }

    async getTodayMoodCheckin(accountId: string) {
        const today = utcDateString(new Date());
        const c = await this.dailyMoodRepository.findOne({ where: { account: { id: accountId }, checkinDate: today } });
        return c ? { completed: true, ...c } : { completed: false, checkinDate: today };
    }

    async saveTodayMoodCheckin(accountId: string, body: any) {
        const today = utcDateString(new Date());
        const existing = await this.dailyMoodRepository.findOne({ where: { account: { id: accountId }, checkinDate: today } });
        if (!existing) {
            const acc = await this.findById(accountId);
            if (!acc) throw new NotFoundException('Account missing');
            const created = this.dailyMoodRepository.create({ account: acc, checkinDate: today, answers: body.answers, moodScore: 70, sentiment: 'Neutral', ...body });
            return this.dailyMoodRepository.save(created);
        } else {
            Object.assign(existing, body);
            return this.dailyMoodRepository.save(existing);
        }
    }

    async getMoodHistory(accountId: string) { return this.dailyMoodRepository.find({ where: { account: { id: accountId } }, order: { checkinDate: 'DESC' }, take: 14 }); }

    async getPurposeTwins(userId: string) {
        const user = await this.accountRepository.findOne({ where: { id: userId } });
        if (!user) return [];

        const myScores = (user.computedScores || {}) as any;
        const myId = user.id;
        const myCompany = user.companyName || 'KaikaAI Labs';

        const query = this.accountRepository.createQueryBuilder('account')
            .where('account.id != :id', { id: myId })
            .andWhere('account.isVerified = true')
            .getMany();
        
        const candidates = await query;
        let twins: any[] = [];

        if (candidates.length > 0) {
            twins = candidates
                .filter(c => c.name && c.name !== 'Pathfinder') // Only real named users
                .map((c) => {
                    const cScores = (c.computedScores || { love: 70, goodAt: 70, worldNeeds: 70, paidFor: 70 }) as any;
                    // Calculate match based on Ikigai scores
                    const diff = Math.abs((myScores.love || 75) - (cScores.love || 75)) + 
                                 Math.abs((myScores.goodAt || 75) - (cScores.goodAt || 75)) + 
                                 Math.abs((myScores.worldNeeds || 75) - (cScores.worldNeeds || 75)) + 
                                 Math.abs((myScores.paidFor || 75) - (cScores.paidFor || 75));
                    
                    const matchScore = Math.max(0, 100 - Math.round(diff / 4.7));
                    const initials = (c.name || 'P').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    
                    return { 
                        id: c.id, 
                        name: c.name, 
                        match: `${matchScore}% Match`, 
                        score: matchScore, 
                        initials: initials || 'PT', 
                        reason: matchScore > 85 ? 'Exceptional Ikigai alignment.' : 'Shared mission goals in ' + (c.department || 'the team') + '.', 
                        role: c.careerStage || 'Lead Pathfinder' 
                    };
                })
                .sort((a, b) => b.score - a.score);
        }

        return twins.slice(0, 4);
    }

    async sendDirectMessage(senderId: string, receiverId: string, content: string) {
        const sender = await this.findById(senderId);
        const receiver = await this.findById(receiverId);
        if (!sender || !receiver) throw new NotFoundException('Not found');
        const dm = this.dmRepository.create({ sender, receiver, content });
        return this.dmRepository.save(dm);
    }

    async getDirectMessages(myId: string, otherId: string) {
        const msgs = await this.dmRepository.find({ where: [{ sender: { id: myId }, receiver: { id: otherId } }, { sender: { id: otherId }, receiver: { id: myId } }], order: { createdAt: 'ASC' }, relations: ['sender'] });
        return msgs.map(m => ({ text: m.content, sender: (m.sender as any).id === myId ? 'me' : 'them', time: 'Just now' }));
    }

    async getGrowthStories(userId: string) {
        const user = await this.accountRepository.findOne({ where: { id: userId } });
        if (!user) return [];
        return this.storyRepository.find({ where: { companyName: user.companyName }, order: { createdAt: 'DESC' }, take: 15 });
    }

    async createGrowthStory(accountId: string, content: string, isAnonymous: boolean) {
        const user = await this.accountRepository.findOne({ where: { id: accountId } });
        const story: DeepPartial<GrowthStory> = { content, authorName: isAnonymous ? 'Anonymous' : (user?.name || 'Pathfinder'), author: isAnonymous ? undefined : (user || undefined), companyName: user?.companyName };
        const s = this.storyRepository.create(story);
        return this.storyRepository.save(s);
    }

    async getPathwaysForUser(userId: string) { 
        const user = await this.accountRepository.findOne({ where: { id: userId } });
        if (!user) return [];

        // Return pathways assigned to me OR general pathways from my company
        return this.pathwayRepository.createQueryBuilder('pathway')
            .leftJoinAndSelect('pathway.hrCreator', 'hr')
            .where('pathway.userId = :userId', { userId })
            .orWhere('(pathway.userId IS NULL AND hr.companyName = :company)', { company: user.companyName || 'KaikaAI Labs' })
            .getMany();
    }
    async getPathwaysForHr(hrId: string) { return this.pathwayRepository.find({ where: { hrCreator: { id: hrId } } }); }

    async getAiCoachingResponse(userId: string, messages: any[]) {
        const user = await this.getEmployeeProfile(userId);
        const scores = user.computedScores || {};
        const systemPrompt = `You are KaikaAI, a world-class Ikigai Coach and Mental Wellness guide. The employee's current Ikigai scores: Love: ${scores.love || 0}, GoodAt: ${scores.goodAt || 0}, WorldNeeds: ${scores.worldNeeds || 0}, PaidFor: ${scores.paidFor || 0}. Goal: Provide deep, philosophical, yet actionable career and wellness advice based on their Ikigai results. Keep responses concise and supportive. Always relate back to their Ikigai where relevant.`;
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY || 'gsk_...'}` }, body: JSON.stringify({ model: 'llama3-70b-8192', messages: [{ role: 'system', content: systemPrompt }, ...messages] }) });
            const data = await response.json();
            return { reply: data.choices[0].message.content };
        } catch (e) {
            return { error: 'Taking a deep breath. Try again soon.' };
        }
    }

    async createPathway(hrId: string, data: any) {
        const hr = await this.findById(hrId);
        if (!hr) throw new NotFoundException('HR missing');
        const user = data.assignedToId ? await this.findById(data.assignedToId) : null;
        const p = this.pathwayRepository.create({ ...data, hrCreator: hr, assignedTo: user || undefined });
        return this.pathwayRepository.save(p);
    }

    async applyToPathway(userId: string, pathwayId: string) {
        const user = await this.findById(userId);
        const pathway = await this.pathwayRepository.findOne({ where: { id: pathwayId }, relations: ['hrCreator', 'assignedTo'] });
        if (!user || !pathway) throw new NotFoundException('Not found');

        // If it's a general pathway (unassigned), assign it to this user
        if (!pathway.assignedTo) {
            pathway.assignedTo = user;
            return this.pathwayRepository.save(pathway);
        }

        // If already assigned to someone else, clone it for this user (personal development copy)
        // Check if I already have a copy of this title
        const exists = await this.pathwayRepository.findOne({ where: { title: pathway.title, assignedTo: { id: userId } } });
        if (exists) return exists;

        const clone = this.pathwayRepository.create({
            title: pathway.title,
            type: pathway.type,
            desc: pathway.desc,
            alignment: pathway.alignment,
            hrCreator: pathway.hrCreator,
            assignedTo: user
        });
        return this.pathwayRepository.save(clone);
    }

    async deletePathway(hrId: string, id: string) { await this.pathwayRepository.delete(id); }

    async getPersonalizedInsights(userId: string) {
        const user = await this.accountRepository.findOne({ where: { id: userId } });
        if (!user) return { insights: [] };
        const recentMoods = await this.dailyMoodRepository.find({ where: { account: { id: userId } }, order: { checkinDate: 'DESC' }, take: 7 });
        const insights: { title: string; content: string; type: string }[] = [];
        if (recentMoods.length >= 3) {
            const avg = Math.round(recentMoods.reduce((s, m) => s + (m.moodScore || 70), 0) / recentMoods.length);
            insights.push({ type: 'Wellbeing', title: 'Your Mood Trend', content: `Average score: ${avg}. Consistent practice is key.` });
        }
        if (user.computedScores) {
            insights.push({ type: 'Purpose', title: 'Ikigai Insight', content: 'Your blueprint is active. Align your tasks with your strongest pillar today.' });
        }
        return { insights };
    }

    async updateStreak(accountId: string) {
        const p = await this.accountRepository.findOne({ where: { id: accountId } });
        if (!p) return;
        const todayStr = utcDateString(new Date());
        if (p.lastDailyVisit) {
            const lastStr = typeof p.lastDailyVisit === 'string' ? p.lastDailyVisit.slice(0, 10) : utcDateString(p.lastDailyVisit as Date);
            if (lastStr === todayStr) return;
            const diff = utcCalendarDaysBetween(todayStr, lastStr);
            p.streakDays = diff === 1 ? p.streakDays + 1 : 1;
        } else {
            p.streakDays = 1;
        }
        p.reflectionCount = (p.reflectionCount || 0) + 1;
        p.lastDailyVisit = todayStr;
        await this.accountRepository.save(p);
        return { streakDays: p.streakDays, reflectionCount: p.reflectionCount };
    }

    async getChatSessions(accountId: string) { return this.chatSessionRepository.find({ where: { account: { id: accountId } }, order: { updatedAt: 'DESC' } }); }
    async getChatSession(id: string) { return this.chatSessionRepository.findOne({ where: { id } }); }
    async saveChatSession(accountId: string, data: any) {
        let session = data.id ? await this.getChatSession(data.id) : null;
        if (!session) {
            const acc = await this.findById(accountId);
            if (!acc) throw new NotFoundException('Account missing');
            session = this.chatSessionRepository.create({ account: acc, title: data.title || 'New Chat', messages: data.messages });
        } else {
            session.messages = data.messages;
            if (data.title) session.title = data.title;
        }
        return this.chatSessionRepository.save(session);
    }
    async deleteChatSession(id: string, userId: string) { await this.chatSessionRepository.delete(id); }

    async getHrTeamStats(hrId: string) {
        const emps = await this.getEmployeesByHr(hrId);
        const count = emps.filter(e => e.isAssessmentCompleted).length;
        return { totalEmployees: emps.length, completedAssessments: count, averageIkigai: { passion: 75, profession: 70, mission: 80, vocation: 72 }, teamMentalHealth: 78, teamBurnoutRisk: 15, mentalHealthBuckets: { thriving: count, steady: 0, atRisk: 0 }, riskAlerts: [] };
    }
    async saveResume(userId: string, resumeText: string) {
        const user = await this.findById(userId);
        if (!user) throw new NotFoundException('User not found');
        user.resumeText = resumeText;
        return this.accountRepository.save(user);
    }

    async getPathwayAdvice(userId: string, pathwayId: string) {
        const user = await this.getEmployeeProfile(userId);
        const pathway = await this.pathwayRepository.findOne({ where: { id: pathwayId } });
        if (!pathway) throw new NotFoundException('Pathway not found');

        if (!user.resumeText) {
            return { needsResume: true };
        }

        const scores = user.computedScores || {};
        const systemPrompt = `You are the KaikaAI Oracle. Your task is to provide a comprehensive, premium career analysis (Strategic Blueprint) for an employee.
        Employee Context:
        - Ikigai Scores: Love: ${scores.love}, Good: ${scores.goodAt}, Needs: ${scores.worldNeeds}, Paid: ${scores.paidFor}
        - Professional Background: ${user.resumeText}
        
        Pathway Context:
        - Title: ${pathway.title}
        - Description: ${pathway.desc}
        
        Provide a JSON response with ONLY these keys:
        - masterAdvice: A deep, one-sentence philosophical/strategic summary of the fit.
        - matchPercent: A number from 0-100 indicating fit.
        - roleLogic: How this role fits their Ikigai.
        - requiredEcosystem: Array of 5 skills/tools they should master.
        - existingMastery: Array of 3 skills they ALREADY have based on context.
        - strategicGaps: Array of 3 specific areas they need to grow.
        - selectionChance: One word (Low, Medium, High, Exceptional).
        
        Keep it professional, high-concept, and actionable.`;

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY || 'gsk_...'}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Generate blueprint.' }],
                    response_format: { type: 'json_object' }
                })
            });
            const data = await response.json();
            return JSON.parse(data.choices[0].message.content);
        } catch (e) {
            // MOCK Fallback if Groq fails or API key missing
            return {
                masterAdvice: `A strategic alignment with ${pathway.title} is within your operational vector, with minor adjustments needed for peak Ikigai harmony.`,
                matchPercent: 88,
                roleLogic: `Your high score in ${scores.love > 70 ? 'Passion' : 'Profession'} naturally pulls you towards this track's core mission.`,
                requiredEcosystem: ["Strategic Architecting", "Stakeholder Diplomacy", "Advanced Ikigai Synergy", "Operational Precision", "Contextual Growth"],
                existingMastery: ["Core Logic", "Self-Awareness", "Pillar Alignment"],
                strategicGaps: ["Uncertainty Resilience", "Systemic Vision", "High-Value Output Sync"],
                selectionChance: "High"
            };
        }
    }
}
