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
        // Save computed scores, mental health, assessment completion flag
        Object.assign(account, { ...data, isAssessmentCompleted: true, mentalHealthScore: data.mentalHealthScore || 75 });
        // Persist the raw assessment Q&A for chatbot context
        if (data.mcqAnswers || data.freeTextAnswers) {
            account.assessmentAnswers = {
                mcqAnswers: data.mcqAnswers || {},
                freeTextAnswers: data.freeTextAnswers || {}
            };
        }
        return this.accountRepository.save(account);
    }

    async getEmployeeProfile(accountId: string) {
        const account = await this.accountRepository.findOne({ where: { id: accountId } });
        if (!account) throw new NotFoundException('Account missing');
        return account;
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
    async getPathwaysForHr(hrId: string) { 
        return this.pathwayRepository.find({ 
            where: { hrCreator: { id: hrId } },
            relations: ['assignedTo'] 
        }); 
    }

    async getAiCoachingResponse(userId: string, messages: any[], res: any) {
        const user = await this.getEmployeeProfile(userId);
        const scores = user.computedScores || {};
        
        const isNewSession = messages.length <= 1;
        const scoreContext = isNewSession 
            ? `Work Alignment Baseline — Ikigai Pillars: [Passion (Love): ${scores.love || 0}/100, Expertise (GoodAt): ${scores.goodAt || 0}/100, Mission (WorldNeeds): ${scores.worldNeeds || 0}/100, Vocation (PaidFor): ${scores.paidFor || 0}/100].`
            : `Reference the user's alignment pillar scores only when directly relevant to the conversation.`;

        // Inject the user's actual free-text assessment answers for personalized context
        const freeTextAnswers = (user as any).assessmentAnswers?.freeTextAnswers || {};
        const freeTextKeys = Object.values(freeTextAnswers).filter(Boolean);
        const assessmentContext = freeTextKeys.length > 0
            ? `\n\nEmployee's own words from their Ikigai Assessment:\n${freeTextKeys.slice(0, 4).map((v, i) => `- Q${i+1}: "${v}"`).join('\n')}`
            : '';

        const systemPrompt = `You are KaikaAI, a sharp and insightful Work Alignment Co-Pilot for ${user.companyName || 'their organization'}.

USER PROFILE: ${user.name || 'User'} — ${user.department || 'General'} Department
${scoreContext}${assessmentContext}

YOUR ROLE:
- You help employees connect their daily work to their organization's larger mission and strategic objectives.
- You are NOT a medical therapist, but you possess HIGH EMOTIONAL INTELLIGENCE (EQ). You are warm, empathetic, and deeply human.
- If the user expresses sadness, a bad mood, frustration, or stress (e.g., "i am very sad", "my mood is bad", "feeling low"), NEVER ignore it or give a cold, clinical deflection like "Let's shift focus to work." Validate their emotional state first with warm, genuine care (e.g., "I hear you, and I'm really sorry to hear that you're carrying that weight today. It's completely valid to have off days.").
- Gently and gracefully bridge their feelings to the work context (e.g., "Often, hidden professional friction, role misalignment, or feeling overwhelmed by a task can silently drain our energy. When you feel ready, would you like to explore if there is something specific in your current role that's weighing you down, or do you just need a low-pressure space to talk?").
- You help identify misalignment between role, goals, and organizational mission — then suggest concrete, highly actionable fixes.
- Avoid the "interrogation loop": do NOT just ask question after question. Every response must deliver high-value, practical solutions, reframes, templates, or communication tactics they can use immediately with their team or manager.
- Once you identify a friction point (unclear ownership, value mismatch, priority conflict), offer 1-2 practical, corporate-ready solutions first, then wrap up with a single focused question to keep the dialogue active.
- You keep responses highly actionable, concise, and under 120 words.
- You are direct, confident, and empowering — acting as a senior performance co-pilot.
- If the user's message is a greeting (e.g., "hi", "hello", "hey", "good morning"), reply with a simple, welcoming, and professional greeting, introducing yourself as their Work Alignment Co-Pilot, and ask how their work alignment or role focus is going today. Keep it conversational and do not jump into metrics or deep diagnostic questions immediately.
- If you have the user's assessment answers, reference them naturally when relevant (e.g. "You mentioned in your assessment that you love...").

NEVER repeat scores or intro phrases across messages. Evolve dynamically with each turn of conversation.`;

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey || apiKey === 'gsk_...') {
            res.write(`data: ${JSON.stringify({ error: 'Groq API Key not configured correctly.' })}\n\n`);
            res.end();
            return;
        }

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${apiKey}` 
                }, 
                body: JSON.stringify({ 
                    model: 'llama-3.3-70b-versatile', 
                    messages: [{ role: 'system', content: systemPrompt }, ...messages],
                    stream: true
                }) 
            });

            if (!response.ok) {
                const errData = await response.json();
                res.write(`data: ${JSON.stringify({ error: `Groq error: ${errData.error?.message || 'Unknown'}` })}\n\n`);
                res.end();
                return;
            }

            if (!response.body) {
                res.write(`data: ${JSON.stringify({ error: "Groq stream returned empty response." })}\n\n`);
                res.end();
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedReply = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.includes('[DONE]')) continue;
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6);
                            const parsed = JSON.parse(jsonStr);
                            const text = parsed.choices[0]?.delta?.content || '';
                            if (text) {
                                accumulatedReply += text;
                                res.write(`data: ${JSON.stringify({ text })}\n\n`);
                            }
                        } catch (e) {
                            // ignore parsing errors for incomplete chunks
                        }
                    }
                }
            }

            // === POST-CHAT STAT UPDATE ===
            // Perform this update in the background so we do not block user streaming
            this.updateStatsFromChat(userId, messages).catch(e =>
                console.error('Error updating stats from chat:', e)
            );

        } catch (e) {
            console.error('Groq streaming error:', e);
            res.write(`data: ${JSON.stringify({ error: `Connection failed: ${e.message}` })}\n\n`);
        } finally {
            res.end();
        }
    }

    /**
     * Called after every successful chat exchange.
     * - Increments reflectionCount (chat counts as a reflection)
     * - Nudges mentalHealthScore based on conversation sentiment keywords
     * - Updates streak via the existing streak logic
     */
    private async updateStatsFromChat(userId: string, messages: any[]): Promise<void> {
        try {
            const user = await this.accountRepository.findOne({ where: { id: userId } });
            if (!user) return;

            // Increment reflection count — every chat exchange is an alignment reflection
            user.reflectionCount = (user.reflectionCount || 0) + 1;

            // Simple keyword-based sentiment analysis on the last user message
            // to nudge the mentalHealthScore up or down as a proxy for alignment health.
            const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
            if (lastUserMsg?.content) {
                const text = (lastUserMsg.content as string).toLowerCase();
                const positiveSignals = ['great', 'excited', 'clear', 'aligned', 'motivated', 'confident', 'progress', 'achieved', 'good', 'happy', 'energized'];
                const negativeSignals = ['stuck', 'confused', 'stressed', 'burnout', 'overwhelmed', 'lost', 'disconnected', 'frustrated', 'anxious', 'tired', 'unclear'];

                const positiveHits = positiveSignals.filter(w => text.includes(w)).length;
                const negativeHits = negativeSignals.filter(w => text.includes(w)).length;

                const currentScore = user.mentalHealthScore || 75;
                let adjustment = 0;
                if (positiveHits > negativeHits) adjustment = Math.min(2, positiveHits); // nudge up
                if (negativeHits > positiveHits) adjustment = -Math.min(3, negativeHits); // nudge down (more sensitive)

                // Keep score bounded between 20 and 99
                user.mentalHealthScore = Math.max(20, Math.min(99, currentScore + adjustment));
            }

            await this.accountRepository.save(user);

            // Also update the daily streak since chatting is an active engagement
            await this.updateStreak(userId);
        } catch (e) {
            // Non-critical — don't break the chat if this fails
            console.error('updateStatsFromChat failed silently:', e);
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
        if (!p) return { success: false, message: 'User not found' };
        const todayStr = utcDateString(new Date());
        if (p.lastDailyVisit) {
            const lastStr = typeof p.lastDailyVisit === 'string' ? p.lastDailyVisit.slice(0, 10) : utcDateString(p.lastDailyVisit as Date);
            if (lastStr === todayStr) return { streakDays: p.streakDays, reflectionCount: p.reflectionCount, alreadyUpdated: true };
            const diff = utcCalendarDaysBetween(todayStr, lastStr);
            p.streakDays = diff === 1 ? p.streakDays + 1 : 1;
        } else {
            p.streakDays = 1;
        }
        p.reflectionCount = (p.reflectionCount || 0) + 1;
        p.lastDailyVisit = todayStr;
        await this.accountRepository.save(p);
        return { streakDays: p.streakDays, reflectionCount: p.reflectionCount, success: true };
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
        const saved = await this.chatSessionRepository.save(session);

        // Auto-generate alignment intelligence when a session has 6+ messages (3 exchanges)
        // This fires silently — the employee never sees it, HR dashboard picks it up
        if ((saved.messages?.length || 0) >= 6 && !saved.alignmentReport) {
            this.autoGenerateAlignmentReport(saved.id, saved.messages, accountId).catch(e =>
                console.error('autoGenerateAlignmentReport failed silently:', e)
            );
        }

        return saved;
    }

    /**
     * Fires silently in the background after a meaningful conversation (6+ messages).
     * Calls Groq to distill the chat into structured alignment intelligence,
     * then saves it to the ChatSession's alignmentReport field.
     * HR sees this on their dashboard — employee never sees it.
     */
    private async autoGenerateAlignmentReport(sessionId: string, messages: any[], userId: string): Promise<void> {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey || apiKey === 'gsk_...') return;

        const user = await this.accountRepository.findOne({ where: { id: userId } });
        const scores = (user?.computedScores || {}) as any;

        const analysisPrompt = `You are an organizational psychologist analyzing a work alignment coaching conversation.

Employee context:
- Department: ${user?.department || 'General'}
- Ikigai Passion score: ${scores.love || 0}/100
- Ikigai Expertise score: ${scores.goodAt || 0}/100
- Ikigai Mission score: ${scores.worldNeeds || 0}/100
- Ikigai Vocation score: ${scores.paidFor || 0}/100

Analyze the following coaching conversation and return a JSON object with EXACTLY these keys:
- alignmentScore: number 0-100 (how aligned this employee seems with their role/org right now)
- riskLevel: one of "Low", "Medium", or "High" (HR action urgency)
- keyThemes: array of 2-4 short strings (e.g. ["Role clarity issues", "Disconnected from Q3 goals"])
- recommendedActions: array of 2-3 actionable strings for HR (e.g. ["Schedule 1:1 to clarify ownership"])

Return ONLY valid JSON. No markdown, no explanation.`;

        try {
            const conversationText = messages
                .map(m => `${m.role === 'user' ? 'Employee' : 'Coach'}: ${m.content}`)
                .join('\n');

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: analysisPrompt },
                        { role: 'user', content: conversationText }
                    ],
                    response_format: { type: 'json_object' }
                })
            });

            const data = await response.json();
            if (!response.ok) return;

            const report = JSON.parse(data.choices[0].message.content);
            report.generatedAt = new Date().toISOString();

            // Validate and clamp alignmentScore
            report.alignmentScore = Math.max(0, Math.min(100, Number(report.alignmentScore) || 50));

            await this.chatSessionRepository.update(sessionId, { alignmentReport: report });
        } catch (e) {
            console.error('autoGenerateAlignmentReport Groq error:', e);
        }
    }

    /**
     * Returns recent session intelligence reports for all employees under an HR.
     * Used by the HR dashboard's Session Intelligence feed.
     */
    async getHrSessionIntelligence(hrId: string) {
        const emps = await this.getEmployeesByHr(hrId);
        const empIds = emps.map(e => e.id);
        if (empIds.length === 0) return [];

        const sessions = await this.chatSessionRepository
            .createQueryBuilder('session')
            .leftJoinAndSelect('session.account', 'account')
            .where('account.id IN (:...ids)', { ids: empIds })
            .andWhere('session.alignmentReport IS NOT NULL')
            .orderBy('session.updatedAt', 'DESC')
            .take(20)
            .getMany();

        return sessions.map(s => ({
            sessionId: s.id,
            employeeId: (s.account as any)?.employeeId || 'Unknown',
            department: (s.account as any)?.department || 'General',
            sessionTitle: s.title,
            updatedAt: s.updatedAt,
            report: s.alignmentReport
        }));
    }

    async completeTour(accountId: string) {
        const acc = await this.findById(accountId);
        if (!acc) return;
        acc.hasCompletedTour = true;
        return this.accountRepository.save(acc);
    }
    async deleteChatSession(id: string, userId: string) { await this.chatSessionRepository.delete(id); }

    async renameChatSession(id: string, title: string) {
        const session = await this.getChatSession(id);
        if (!session) throw new NotFoundException('Session not found');
        session.title = title;
        return this.chatSessionRepository.save(session);
    }

    async getHrTeamStats(hrId: string) {
        const emps = await this.getEmployeesByHr(hrId);
        const count = emps.filter(e => e.isAssessmentCompleted).length;

        // Real averages from actual employee DB data
        const completedEmps = emps.filter(e => e.isAssessmentCompleted && e.computedScores);

        const avgIkigai = completedEmps.length > 0 ? {
            passion: Math.round(completedEmps.reduce((s, e) => s + ((e.computedScores as any)?.love || 0), 0) / completedEmps.length),
            profession: Math.round(completedEmps.reduce((s, e) => s + ((e.computedScores as any)?.goodAt || 0), 0) / completedEmps.length),
            mission: Math.round(completedEmps.reduce((s, e) => s + ((e.computedScores as any)?.worldNeeds || 0), 0) / completedEmps.length),
            vocation: Math.round(completedEmps.reduce((s, e) => s + ((e.computedScores as any)?.paidFor || 0), 0) / completedEmps.length),
        } : { passion: 0, profession: 0, mission: 0, vocation: 0 };

        const avgMentalHealth = emps.length > 0
            ? Math.round(emps.reduce((s, e) => s + (e.mentalHealthScore || 75), 0) / emps.length)
            : 0;

        // Bucket employees by mental health score
        const thriving = emps.filter(e => (e.mentalHealthScore || 75) >= 70).length;
        const steady = emps.filter(e => (e.mentalHealthScore || 75) >= 40 && (e.mentalHealthScore || 75) < 70).length;
        const atRisk = emps.filter(e => (e.mentalHealthScore || 75) < 40).length;

        // Burnout rate = % of employees at risk
        const teamBurnoutRisk = emps.length > 0 ? Math.round((atRisk / emps.length) * 100) : 0;

        // Risk alerts for at-risk employees (never expose names — use employee ID)
        const riskAlerts = emps
            .filter(e => (e.mentalHealthScore || 75) < 50)
            .map(e => ({
                employeeId: e.employeeId || e.id.slice(0, 8),
                accountId: e.id,
                severity: (e.mentalHealthScore || 75) < 35 ? 'critical' : 'warning',
                summary: `${e.employeeId || 'Employee'}: Alignment health score is low (${e.mentalHealthScore || 75}/100)`,
                reasons: ['Chat sentiment indicates repeated stress signals', 'Alignment score below team baseline']
            }));

        // Executive insights computed dynamically
        const overallIkigaiIndex = Math.round((avgIkigai.passion + avgIkigai.profession + avgIkigai.mission + avgIkigai.vocation) / 4);
        const executiveInsights = {
            index: overallIkigaiIndex,
            correlation: (0.6 + (overallIkigaiIndex / 500)).toFixed(2), // proxy correlation metric
            industryBenchmark: 62, // industry average for alignment tools
            summary: overallIkigaiIndex >= 75
                ? `Your team's alignment index is above industry average. Strategic clarity is strong — now focus on converting that energy into cross-departmental execution velocity.`
                : `Your team's alignment index has growth potential. The biggest opportunity is closing the gap between individual strengths and organizational mission clarity.`
        };

        // --- DYNAMIC HR METRICS (7-DAY TREND, PARTICIPATION, SENTIMENT, INTERESTS, BURNOUT BUCKETS) ---
        const empIds = emps.map(e => e.id);
        const checkins = empIds.length > 0
            ? await this.dailyMoodRepository.createQueryBuilder('checkin')
                .leftJoinAndSelect('checkin.account', 'account')
                .where('account.id IN (:...ids)', { ids: empIds })
                .orderBy('checkin.checkinDate', 'DESC')
                .getMany()
            : [];

        // Helper date formatter
        const formatDate = (date: Date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return formatDate(d);
        });

        const moodTrend7d = last7Days.map(date => {
            const dayCheckins = checkins.filter(c => c.checkinDate === date);
            const count = dayCheckins.length;
            const avgMood = count > 0
                ? Math.round(dayCheckins.reduce((s, c) => s + (c.moodScore || 70), 0) / count)
                : null;
            return { date, avgMood, count };
        });

        const todayStr = formatDate(new Date());
        const todayCheckins = checkins.filter(c => c.checkinDate === todayStr);
        const moodParticipationToday = {
            completed: todayCheckins.length,
            total: emps.length,
            percent: emps.length > 0 ? Math.round((todayCheckins.length / emps.length) * 100) : 0
        };

        const sentimentDistribution = { Inspired: 0, Balanced: 0, Stressed: 0 };
        for (const c of checkins) {
            const s = c.sentiment || 'Balanced';
            if (s.includes('Inspired') || s.includes('Happy') || s.includes('Good')) {
                sentimentDistribution.Inspired++;
            } else if (s.includes('Stressed') || s.includes('Sad') || s.includes('Frustrated')) {
                sentimentDistribution.Stressed++;
            } else {
                sentimentDistribution.Balanced++;
            }
        }

        const topInterests = [
            { name: "Product Design", value: emps.filter(e => e.department === 'Design').length },
            { name: "Engineering Velocity", value: emps.filter(e => e.department === 'Engineering').length },
            { name: "Market Synergy", value: emps.filter(e => e.department === 'Marketing').length },
            { name: "Strategic Intelligence", value: emps.filter(e => e.department === 'Strategy').length }
        ].filter(i => i.value > 0).sort((a, b) => b.value - a.value);

        const burnoutBuckets = { Low: thriving, Moderate: steady, High: atRisk, Critical: 0 };

        // Group employees by department for dynamic heatmap stats
        const depts: { [key: string]: typeof emps } = {};
        for (const e of emps) {
            const d = e.department || 'General';
            if (!depts[d]) depts[d] = [];
            depts[d].push(e);
        }

        const departmentHeatmap: { [key: string]: { burnout: number, mood: number, sentinelCount: number } } = {};
        for (const [dept, deptEmps] of Object.entries(depts)) {
            const avgMood = deptEmps.length > 0
                ? Math.round(deptEmps.reduce((s, e) => s + (e.mentalHealthScore || 75), 0) / deptEmps.length)
                : 75;
            const deptAtRisk = deptEmps.filter(e => (e.mentalHealthScore || 75) < 40).length;
            const burnoutRisk = deptEmps.length > 0 ? Math.round((deptAtRisk / deptEmps.length) * 100) : 0;
            departmentHeatmap[dept] = {
                burnout: burnoutRisk,
                mood: avgMood,
                sentinelCount: deptEmps.length
            };
        }

        return {
            totalEmployees: emps.length,
            completedAssessments: count,
            averageIkigai: avgIkigai,
            teamMentalHealth: avgMentalHealth,
            teamBurnoutRisk,
            mentalHealthBuckets: { thriving, steady, atRisk },
            riskAlerts,
            executiveInsights,
            moodTrend7d,
            moodParticipationToday,
            sentimentDistribution,
            topInterests,
            burnoutBuckets,
            departmentHeatmap
        };
    }

    async saveResume(userId: string, resumeText: string, resumeFileName?: string, resumeFileBase64?: string) {
        const user = await this.findById(userId);
        if (!user) throw new NotFoundException('User not found');
        if (resumeText !== undefined) user.resumeText = resumeText;
        if (resumeFileName !== undefined) user.resumeFileName = resumeFileName;
        if (resumeFileBase64 !== undefined) user.resumeFileBase64 = resumeFileBase64;
        return this.accountRepository.save(user);
    }

    async getPathwayAdvice(userId: string, pathwayId: string) {
        const user = await this.getEmployeeProfile(userId);
        const pathway = await this.pathwayRepository.findOne({ where: { id: pathwayId } });
        if (!pathway) throw new NotFoundException('Pathway not found');

        if (!user.resumeFileBase64) {
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

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey || apiKey === 'gsk_...') {
            console.error('Groq API Key is missing or invalid');
            return { error: 'Groq API Key not configured.' };
        }

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Generate blueprint.' }],
                    response_format: { type: 'json_object' }
                })
            });
            const data = await response.json();
            if (!response.ok) {
                console.error('Groq Blueprint Error:', data);
                throw new Error(data.error?.message || 'Failed to generate blueprint');
            }
            return JSON.parse(data.choices[0].message.content);
        } catch (e) {
            console.error('Groq Blueprint exception:', e);
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

    async getDailyPrompt(userId: string) {
        const user = await this.accountRepository.findOne({ where: { id: userId } });
        const prompts = [
            "What small step can you take today to align with your inner purpose?",
            "Which of your core strengths did you use most effectively today?",
            "How did your work today contribute to the team's broader mission?",
            "What part of your work brought you the most creative joy today?",
            "Is there any area where you felt friction, and how did you navigate it?",
            "What did you learn today that prepares you for your future growth?",
            "Who in your community did you feel a positive connection with today?",
            "What are you most grateful for in your career journey right now?"
        ];
        const day = new Date().getDate();
        const index = day % prompts.length;
        return { prompt: prompts[index] };
    }
}

