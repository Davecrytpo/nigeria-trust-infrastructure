import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum UserRole {
  RESIDENT = 'RESIDENT',
  RESPONDER = 'RESPONDER',
  OPERATOR = 'OPERATOR',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  SUSPENDED = 'SUSPENDED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column()
  fullName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.RESIDENT })
  role: UserRole;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 50.0 })
  trustScore: number;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Column({ nullable: true })
  deviceId: string;

  @CreateDateColumn()
  createdAt: Date;
}
