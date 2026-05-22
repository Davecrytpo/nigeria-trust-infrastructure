import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../trust/entities/user.entity';

export enum ResponderTier {
  TIER_1_COMMUNITY = 'TIER_1_COMMUNITY',
  TIER_2_INSTITUTIONAL = 'TIER_2_INSTITUTIONAL',
}

@Entity('responder_profiles')
export class ResponderProfile {
  @PrimaryColumn()
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: ResponderTier })
  tier: ResponderTier;

  @Column('text', { array: true, default: '{}' })
  specialties: string[];

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  lastKnownLocation: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  assignedTerritory: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;
}
