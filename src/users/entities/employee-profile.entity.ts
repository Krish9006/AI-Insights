import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class EmployeeProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Account, { onDelete: 'CASCADE' })
    @JoinColumn()
    account: Account;

    // Store the 15 MCQ answers (e.g., Q1: 4, Q2: 2)
    @Column({ type: 'jsonb', nullable: true })
    mcqAnswers: Record<string, number>;

    // Store the computed scores (e.g., Technical: 8, Creative: 5, Teamwork: 9)
    @Column({ type: 'jsonb', nullable: true })
    computedScores: Record<string, number>;

    // Store the 5 descriptive free-text answers
    @Column({ type: 'jsonb', nullable: true })
    freeTextAnswers: Record<string, string>;
    
    // Semantically extracted keywords
    @Column('simple-array', { nullable: true })
    interests: string[];

    @Column('simple-array', { nullable: true })
    dislikes: string[];

    // This flag determines if the user has completed the mandatory 20-question flow
    @Column({ default: false })
    isAssessmentCompleted: boolean;

    // AI-TRACKED METRICS (Aggregated for HR)
    @Column({ default: 80 }) // 0-100
    mentalHealthScore: number;

    @Column({ default: 0 }) // 0-100
    burnoutRisk: number;

    @Column({ default: 'Balanced' }) // Balanced, Inspired, Under-pressure, Burnt-out
    sentiment: string;

    /** Consecutive calendar days (UTC) the user opened the dashboard at least once. */
    @Column({ default: 0 })
    streakDays: number;

    /** Total “reflection days” — increments at most once per UTC day on dashboard visit. */
    @Column({ default: 0 })
    reflectionCount: number;

    /** Last UTC calendar day we applied streak / reflection logic (YYYY-MM-DD). */
    @Column({ type: 'date', nullable: true })
    lastDailyVisit: string | Date | null;

    @Column({ default: false })
    hasCompletedTour: boolean;
}
