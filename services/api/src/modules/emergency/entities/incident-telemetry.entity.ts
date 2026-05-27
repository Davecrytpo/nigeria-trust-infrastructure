import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Incident } from '../entities/incident.entity';

@Entity('incident_telemetry')
export class IncidentTelemetry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Incident)
  incident: Incident;

  @Column()
  incidentId: string;

  @Column()
  stage: string;

  @Column({
    type: 'int',
    comment: 'Latency in milliseconds from previous stage',
  })
  latencyMs: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Network status, battery level, etc.',
  })
  context: any;

  @CreateDateColumn()
  recordedAt: Date;
}
