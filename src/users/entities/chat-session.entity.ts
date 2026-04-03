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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
