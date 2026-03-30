import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { EmployeeProfile } from './employee-profile.entity';

export enum Role {
    SUPERADMIN = 'SUPERADMIN',
    HR = 'HR',
    USER = 'USER',
}

@Entity()
export class Account {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, nullable: true })
    email?: string; // For SuperAdmin and HR

    @Column()
    password?: string; // Hashed password

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.USER,
    })
    role: Role;

    @Column({ default: false })
    isVerified: boolean; // Especially for HR

    @Column({ unique: true, nullable: true })
    employeeId?: string; // Only for Users created by HR

    @Column({ nullable: true })
    companyName?: string; // For HR

    // The HR who created this user
    @ManyToOne(() => Account, { nullable: true })
    @JoinColumn({ name: 'hrId' })
    hrCreator?: Account;

    @OneToOne(() => EmployeeProfile, profile => profile.account, { cascade: true })
    profile?: EmployeeProfile;
}
