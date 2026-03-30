import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Account } from './account.entity';

@Entity()
@Index(['account', 'checkinDate'], { unique: true })
export class DailyMoodCheckin {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Account, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId' })
    account: Account;

    // UTC calendar day this check-in belongs to (YYYY-MM-DD)
    @Column({ type: 'date' })
    checkinDate: string;

    // q1..q5 values, each expected 1-5 from frontend
    @Column({ type: 'jsonb' })
    answers: Record<string, number>;

    // Average mood from answers, 0-100 normalized
    @Column({ default: 0 })
    moodScore: number;

    @Column({ type: 'text', nullable: true })
    note?: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
