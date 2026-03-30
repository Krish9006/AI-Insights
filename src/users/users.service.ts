import { Injectable, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, Role } from './entities/account.entity';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { DailyMoodCheckin } from './entities/daily-mood-checkin.entity';
import * as bcrypt from 'bcrypt';

function utcDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function toUtcDateString(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return utcDateString(value);
}

/** Whole-day difference in UTC (a - b). */
function utcCalendarDaysBetween(aYmd: string, bYmd: string): number {
  const [ay, am, ad] = aYmd.split('-').map(Number);
  const [by, bm, bd] = bYmd.split('-').map(Number);
  const aMs = Date.UTC(ay, am - 1, ad);
  const bMs = Date.UTC(by, bm - 1, bd);
  return Math.round((aMs - bMs) / (24 * 60 * 60 * 1000));
}

function last7UtcDates(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    out.push(utcDateString(d));
  }
  return out;
}

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
        @InjectRepository(EmployeeProfile)
        private readonly profileRepository: Repository<EmployeeProfile>,
        @InjectRepository(DailyMoodCheckin)
        private readonly dailyMoodRepository: Repository<DailyMoodCheckin>,
    ) { }

    async onModuleInit() {
        // Seed or Update SuperAdmin
        const adminEmail = process.env.SUPERADMIN_EMAIL || 's@gmail.com';
        const adminPassword = process.env.SUPERADMIN_PASSWORD || '123';

        let superAdmin = await this.accountRepository.findOne({ where: { role: Role.SUPERADMIN } });
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(adminPassword, salt);

        if (!superAdmin) {
            superAdmin = this.accountRepository.create({
                email: adminEmail,
                password: hash,
                role: Role.SUPERADMIN,
                isVerified: true
            });
            await this.accountRepository.save(superAdmin);
            console.log(`Seeded SuperAdmin: ${adminEmail}`);
        } else {
            // Update existing if credentials don't match
            superAdmin.email = adminEmail;
            superAdmin.password = hash;
            await this.accountRepository.save(superAdmin);
            console.log(`Updated SuperAdmin credentials: ${adminEmail}`);
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

    async findById(id: string): Promise<Account | null> {
        return this.accountRepository.findOne({ where: { id } });
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

    async getEmployeesByHr(hrId: string): Promise<Account[]> {
        return this.accountRepository.find({
            where: { hrCreator: { id: hrId }, role: Role.USER },
            relations: ['profile'],
            order: { employeeId: 'ASC' },
        });
    }

    async saveEmployeeProfile(accountId: string, profileData: Partial<EmployeeProfile>): Promise<EmployeeProfile> {
        let account = await this.accountRepository.findOne({ where: { id: accountId }, relations: ['profile'] });
        
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        console.log(`[Profile Update] Saving profile for Account: ${accountId}. Has existing profile: ${!!account.profile}`);

        if (!account.profile) {
            account.profile = this.profileRepository.create({ 
                account, 
                isAssessmentCompleted: true, 
                ...profileData 
            });
            console.log(`[Profile Update] Created NEW profile for ${accountId}`);
        } else {
            Object.assign(account.profile, profileData);
            account.profile.isAssessmentCompleted = true;
            console.log(`[Profile Update] Updated EXISTING profile for ${accountId}`);
        }

        const saved = await this.profileRepository.save(account.profile);
        console.log(`[Profile Update] Profile saved successfully. Assessment Status: ${saved.isAssessmentCompleted}`);
        return saved;
    }

    async getEmployeeProfile(accountId: string): Promise<EmployeeProfile> {
        const profile = await this.profileRepository.findOne({ where: { account: { id: accountId } } });
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }
        return profile;
    }

    /**
     * Updates streak / reflection counters on a new UTC day when the employee opens the dashboard,
     * then returns values for the stats strip. Clarity maps to mentalHealthScore (0–100).
     */
    async getDashboardStats(accountId: string): Promise<{
        streakDays: number;
        reflectionCount: number;
        clarityScore: number;
    }> {
        const profile = await this.profileRepository.findOne({ where: { account: { id: accountId } } });
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        const today = utcDateString(new Date());
        const lastStr = toUtcDateString(profile.lastDailyVisit);

        if (lastStr === today) {
            return {
                streakDays: profile.streakDays ?? 0,
                reflectionCount: profile.reflectionCount ?? 0,
                clarityScore: profile.mentalHealthScore ?? 0,
            };
        }

        if (!lastStr) {
            profile.streakDays = 1;
            profile.reflectionCount = (profile.reflectionCount ?? 0) + 1;
        } else {
            const gap = utcCalendarDaysBetween(today, lastStr);
            if (gap === 1) {
                profile.streakDays = (profile.streakDays ?? 0) + 1;
            } else if (gap > 1 || gap < 0) {
                profile.streakDays = 1;
            }
            profile.reflectionCount = (profile.reflectionCount ?? 0) + 1;
        }

        profile.lastDailyVisit = today;
        await this.profileRepository.save(profile);

        return {
            streakDays: profile.streakDays,
            reflectionCount: profile.reflectionCount,
            clarityScore: profile.mentalHealthScore ?? 0,
        };
    }

    async getTodayMoodCheckin(accountId: string): Promise<{
        completed: boolean;
        checkinDate: string;
        moodScore?: number;
        answers?: Record<string, number>;
        note?: string | null;
    }> {
        const today = utcDateString(new Date());
        const checkin = await this.dailyMoodRepository.findOne({
            where: { account: { id: accountId }, checkinDate: today },
        });

        if (!checkin) {
            return { completed: false, checkinDate: today };
        }

        return {
            completed: true,
            checkinDate: today,
            moodScore: checkin.moodScore,
            answers: checkin.answers,
            note: checkin.note,
        };
    }

    async saveTodayMoodCheckin(
        accountId: string,
        body: { answers: Record<string, number>; note?: string | null },
    ): Promise<{ success: true; checkinDate: string; moodScore: number }> {
        const today = utcDateString(new Date());
        const answers = body?.answers || {};
        const keys = ['q1', 'q2', 'q3', 'q4', 'q5'];
        const values = keys.map((k) => Number(answers[k] ?? 0));

        const allValid = values.every((v) => Number.isFinite(v) && v >= 1 && v <= 5);
        if (!allValid) {
            throw new ConflictException('Mood check-in requires q1..q5 values between 1 and 5');
        }

        const average = values.reduce((a, b) => a + b, 0) / values.length;
        const moodScore = Math.round((average / 5) * 100);

        let checkin = await this.dailyMoodRepository.findOne({
            where: { account: { id: accountId }, checkinDate: today },
            relations: ['account'],
        });

        if (!checkin) {
            const account = await this.accountRepository.findOne({ where: { id: accountId } });
            if (!account) {
                throw new NotFoundException('Account not found');
            }
            checkin = this.dailyMoodRepository.create({
                account,
                checkinDate: today,
                answers,
                moodScore,
                note: body?.note || null,
            });
        } else {
            checkin.answers = answers;
            checkin.moodScore = moodScore;
            checkin.note = body?.note || null;
        }

        await this.dailyMoodRepository.save(checkin);
        return { success: true, checkinDate: today, moodScore };
    }

    async getHrTeamStats(hrId: string) {
        // Resolve via explicit joins so hr linkage + inverse OneToOne profile load reliably (JWT uses account id; employees often have no email).
        const employees = await this.accountRepository
            .createQueryBuilder('account')
            .leftJoinAndSelect('account.profile', 'profile')
            .innerJoin('account.hrCreator', 'hr')
            .where('hr.id = :hrId', { hrId })
            .andWhere('account.role = :role', { role: Role.USER })
            .getMany();

        const empIds = employees.map((e) => e.id);
        const today = utcDateString(new Date());
        const sevenDays = last7UtcDates();

        let moodTrendRows: Array<{ date: string; avgMood: string; cnt: string }> = [];
        if (empIds.length) {
            moodTrendRows = await this.dailyMoodRepository
                .createQueryBuilder('m')
                .select('m.checkinDate', 'date')
                .addSelect('AVG(m.moodScore)', 'avgMood')
                .addSelect('COUNT(m.id)', 'cnt')
                .where('m.accountId IN (:...ids)', { ids: empIds })
                .andWhere('m.checkinDate >= :since', { since: sevenDays[0] })
                .groupBy('m.checkinDate')
                .orderBy('m.checkinDate', 'ASC')
                .getRawMany();
        }

        const trendMap = new Map(moodTrendRows.map((r) => [r.date, r]));
        const moodTrend7d = sevenDays.map((d) => {
            const r = trendMap.get(d);
            const cnt = r ? Number(r.cnt) : 0;
            return {
                date: d,
                avgMood: cnt > 0 && r ? Math.round(Number(r.avgMood)) : null,
                count: cnt,
            };
        });

        let todayCount = 0;
        let rawMoods: Array<{ accountId: string; moodScore: string }> = [];
        if (empIds.length) {
            todayCount = await this.dailyMoodRepository
                .createQueryBuilder('m')
                .where('m.checkinDate = :today', { today })
                .andWhere('m.accountId IN (:...ids)', { ids: empIds })
                .getCount();

            rawMoods = await this.dailyMoodRepository
                .createQueryBuilder('m')
                .select('m.accountId', 'accountId')
                .addSelect('m.moodScore', 'moodScore')
                .where('m.checkinDate = :today', { today })
                .andWhere('m.accountId IN (:...ids)', { ids: empIds })
                .getRawMany();
        }

        const moodMap = new Map(rawMoods.map((r) => [r.accountId, Number(r.moodScore)]));

        const totalEmployees = employees.length;
        const moodParticipationToday = {
            completed: todayCount,
            total: totalEmployees,
            percent: totalEmployees ? Math.round((todayCount / totalEmployees) * 100) : 0,
        };

        const activeProfiles = employees
            .map((e) => e.profile)
            .filter((p) => p && p.isAssessmentCompleted);

        const count = activeProfiles.length;

        const mentalHealthBuckets = { thriving: 0, steady: 0, atRisk: 0 };
        activeProfiles.forEach((p) => {
            if (!p) return;
            const s = p.mentalHealthScore ?? 0;
            if (s >= 70) mentalHealthBuckets.thriving++;
            else if (s >= 40) mentalHealthBuckets.steady++;
            else mentalHealthBuckets.atRisk++;
        });

        type RiskSeverity = 'critical' | 'warning';
        const riskAlerts: Array<{
            employeeId: string;
            accountId: string;
            severity: RiskSeverity;
            summary: string;
            reasons: string[];
        }> = [];

        for (const e of employees) {
            const p = e.profile;
            const mood = moodMap.get(e.id);
            const reasons: string[] = [];
            let severity: RiskSeverity = 'warning';

            if (p?.isAssessmentCompleted) {
                const br = p.burnoutRisk ?? 0;
                const mh = p.mentalHealthScore ?? 0;
                const sent = (p.sentiment || '').toLowerCase();

                if (br >= 80) {
                    reasons.push('Burnout risk is very high');
                    severity = 'critical';
                } else if (br >= 65) {
                    reasons.push('Burnout risk is elevated');
                }

                if (mh <= 30) {
                    reasons.push('Wellbeing score is critically low');
                    severity = 'critical';
                } else if (mh <= 45) {
                    reasons.push('Wellbeing score is low');
                }

                if (sent.includes('burnt')) {
                    reasons.push('Sentiment flagged as burnt-out');
                    severity = 'critical';
                } else if (sent.includes('under')) {
                    reasons.push('Sentiment flagged as under pressure');
                }

                if (mood != null) {
                    if (mood < 30) {
                        reasons.push("Today's mood check-in is very low");
                        severity = 'critical';
                    } else if (mood < 45) {
                        reasons.push("Today's mood check-in is low");
                    }
                }
            } else if (mood != null && mood < 35) {
                reasons.push('Low mood before completing assessment');
                severity = 'warning';
            }

            if (reasons.length) {
                const label = e.employeeId ?? e.id;
                const summary =
                    reasons.length > 1
                        ? `${label}: multiple wellbeing signals`
                        : `${label}: ${reasons[0]}`;
                riskAlerts.push({
                    employeeId: label,
                    accountId: e.id,
                    severity,
                    reasons,
                    summary,
                });
            }
        }

        riskAlerts.sort((a, b) => {
            if (a.severity === b.severity) return 0;
            return a.severity === 'critical' ? -1 : 1;
        });

        const emptyCore = {
            totalEmployees,
            completedAssessments: 0,
            averageIkigai: { passion: 0, profession: 0, mission: 0, vocation: 0 },
            teamMentalHealth: 0,
            teamBurnoutRisk: 0,
            sentimentDistribution: {} as Record<string, number>,
            topInterests: [] as { name: string; value: number }[],
            burnoutBuckets: { Low: 0, Moderate: 0, High: 0, Critical: 0 },
            moodTrend7d,
            moodParticipationToday,
            riskAlerts,
            mentalHealthBuckets,
        };

        if (count === 0) {
            return emptyCore;
        }

        // 1. Calculate Average Ikigai Scores
        const avgIkigai = { passion: 0, profession: 0, mission: 0, vocation: 0 };
        activeProfiles.forEach((p) => {
            if (p) {
                avgIkigai.passion += (p.computedScores?.love || p.computedScores?.passion || 0);
                avgIkigai.profession += (p.computedScores?.goodAt || p.computedScores?.profession || 0);
                avgIkigai.mission += (p.computedScores?.worldNeeds || p.computedScores?.mission || 0);
                avgIkigai.vocation += (p.computedScores?.paidFor || p.computedScores?.vocation || 0);
            }
        });
        Object.keys(avgIkigai).forEach((k) => (avgIkigai[k] = Math.round(avgIkigai[k] / count)));

        // 2. Average Wellness Metrics
        const avgHealth = Math.round(activeProfiles.reduce((acc, p) => acc + (p?.mentalHealthScore || 0), 0) / count);
        const avgBurnout = Math.round(activeProfiles.reduce((acc, p) => acc + (p?.burnoutRisk || 0), 0) / count);

        // 3. Sentiment Distribution
        const sentimentMap: Record<string, number> = {};
        activeProfiles.forEach((p) => {
            if (p) {
                const s = p.sentiment || 'Balanced';
                sentimentMap[s] = (sentimentMap[s] || 0) + 1;
            }
        });

        // 4. Top Interests (Aggregated from simple-array)
        const interestMap: Record<string, number> = {};
        activeProfiles.forEach((p) => {
            if (p) {
                (p.interests || []).forEach((i) => {
                    interestMap[i] = (interestMap[i] || 0) + 1;
                });
            }
        });
        const topInterests = Object.entries(interestMap)
            .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));

        // 5. Burnout Risk Histogram buckets
        const burnoutBuckets = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
        activeProfiles.forEach((p) => {
            if (p) {
                const risk = p.burnoutRisk || 0;
                if (risk < 25) burnoutBuckets.Low++;
                else if (risk < 50) burnoutBuckets.Moderate++;
                else if (risk < 75) burnoutBuckets.High++;
                else burnoutBuckets.Critical++;
            }
        });

        return {
            totalEmployees,
            completedAssessments: count,
            averageIkigai: avgIkigai,
            teamMentalHealth: avgHealth,
            teamBurnoutRisk: avgBurnout,
            sentimentDistribution: sentimentMap,
            topInterests,
            burnoutBuckets,
            moodTrend7d,
            moodParticipationToday,
            riskAlerts,
            mentalHealthBuckets,
        };
    }
}
