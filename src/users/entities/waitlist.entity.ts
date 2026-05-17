import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class WaitlistEntry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    companyName?: string;

    @Column({ nullable: true })
    teamSize?: string;

    @CreateDateColumn()
    createdAt: Date;
}
