import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class ChatSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Account, { onDelete: 'CASCADE' })
    account: Account;

    @Column()
    title: string;

    @Column({ type: 'jsonb' })
    messages: { role: string, content: string }[];

    // Auto-generated alignment intelligence — populated silently after meaningful conversations
    @Column({ type: 'jsonb', nullable: true })
    alignmentReport: {
        alignmentScore: number;       // 0-100
        riskLevel: 'Low' | 'Medium' | 'High';
        keyThemes: string[];          // e.g. ["Role clarity issues", "Goal disconnection"]
        recommendedActions: string[]; // e.g. ["Schedule 1:1 with manager"]
        generatedAt: string;          // ISO timestamp
    } | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
