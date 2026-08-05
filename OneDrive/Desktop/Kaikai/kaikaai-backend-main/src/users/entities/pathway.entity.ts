import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class Pathway {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // 'Project', 'Mentorship', 'Learning'

  @Column()
  title: string;

  @Column()
  alignment: string; // 'Passion', 'Profession', 'Vocation', 'Mission'

  @Column('text')
  desc: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hrId' })
  hrCreator: Account;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  assignedTo: Account;

  @Column('simple-array', { nullable: true })
  requiredSkills: string[];

  @CreateDateColumn()
  createdAt: Date;
}
