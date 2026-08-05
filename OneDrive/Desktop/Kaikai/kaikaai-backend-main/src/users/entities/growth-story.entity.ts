import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class GrowthStory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Account, { nullable: true })
    author: Account;

    @Column({ default: 'Anonymous' })
    authorName: string;

    @Column('text')
    content: string;

    @Column({ nullable: true })
    companyName: string;

    @CreateDateColumn()
    createdAt: Date;
}
