import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../trust/entities/user.entity';
import { IncidentType, IncidentStage, Severity, EntryMethod } from '@shared/domain';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @Column()
  requesterId: string;

  @Column({ type: 'enum', enum: IncidentType })
  type: IncidentType;

  @Column({ type: 'enum', enum: IncidentStage, default: IncidentStage.DETECTION })
  stage: IncidentStage;

  @Column({ type: 'enum', enum: Severity })
  severity: Severity;

  @Column({ type: 'enum', enum: EntryMethod })
  entryMethod: EntryMethod;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: string;

  @Column({ nullable: true })
  nearbyLandmarks: string;

  @Column({ type: 'jsonb', nullable: true })
  deviceContext: any;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  closedAt: Date;
}
