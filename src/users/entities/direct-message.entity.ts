import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class DirectMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Account, { onDelete: 'CASCADE' })
    sender: Account;

    @ManyToOne(() => Account, { onDelete: 'CASCADE' })
    receiver: Account;

    @Column('text')
    content: string;

    @CreateDateColumn()
    createdAt: Date;
}
