import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rmd_projects')
export class RmdProject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectCode: string; // e.g., 'RMD-PROJ-2026-01'

  @Column()
  projectName: string; // e.g., 'Advanced Polymer Matrix'

  @Column()
  leadResearcher: string;

  @Column({ default: 'Discovery Phase' })
  status: string; // Discovery Phase, Formulation, Prototype Testing, Approved

  @CreateDateColumn()
  startDate: Date;
}