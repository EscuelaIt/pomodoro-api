import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('pomodoro_sessions')
export class PomodoroSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('datetime')
  startTime: Date;

  @Column('datetime', { nullable: true })
  endTime: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
