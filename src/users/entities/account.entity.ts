import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

export enum Role {
    SUPERADMIN = 'SUPERADMIN',
    HR = 'HR',
    USER = 'USER',
}

@Entity()
export class Account {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    name?: string;

    @Column({ unique: true, nullable: true })
    email?: string;

    @Column()
    password?: string;

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.USER,
    })
    role: Role;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ unique: true, nullable: true })
    employeeId?: string;

    @Column({ nullable: true })
    companyName?: string;

    @Column({ nullable: true })
    department?: string;

    @Column({ nullable: true })
    careerStage?: string;

    // AI & IKIGAI DATA (Merged from Profile)
    @Column({ type: 'jsonb', nullable: true })
    computedScores: Record<string, number>;

    @Column({ default: false })
    isAssessmentCompleted: boolean;

    @Column({ default: false })
    hasCompletedTour: boolean;

    @Column({ default: 75 })
    mentalHealthScore: number;

    @Column({ default: 0 })
    streakDays: number;

    @Column({ default: 0 })
    reflectionCount: number;

    @Column({ type: 'date', nullable: true })
    lastDailyVisit: string | Date | null;

    @Column({ type: 'text', nullable: true })
    resumeText: string;

    @Column({ type: 'text', nullable: true })
    resumeFileName?: string;

    @Column({ type: 'text', nullable: true })
    resumeFileBase64?: string;

    // Raw Ikigai assessment Q&A — stored so the AI chatbot can reference specific answers
    @Column({ type: 'jsonb', nullable: true })
    assessmentAnswers: {
        mcqAnswers: Record<string, number>;
        freeTextAnswers: Record<string, string>;
    } | null;

    // Relationship: The HR who created this user
    @ManyToOne(() => Account, { nullable: true })
    @JoinColumn({ name: 'hrId' })
    hrCreator?: Account;
}
