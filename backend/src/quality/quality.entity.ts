// backend/src/quality/quality.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('quality_inspections')
export class QualityInspection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  auditId: string; // e.g., QA-AUD-2026-101

  @Column()
  batchId: string; // Linked to production batch

  @Column()
  productCategory: string; // Tablet, Capsule, PFS, Syrup, ORS Saline, Derma

  @Column()
  productName: string; // e.g., Maxpro 40 Capsule

  @Column()
  productionStage: string; // e.g., Dispensing, Blending, Encapsulation, Compression, Coating, Blistering, Packing

  @Column()
  leadAnalyst: string; // Biochemist / Lab Pharmacist name

  @Column({ type: 'text' })
  testParameters: string; // JSON string containing dynamic parameters (pH, Assay %, Viscosity, Leak test, Microbial limit)

  @Column()
  assayResult: string; // e.g., Passed (99.4%) or Out of Specification (OOS)

  @Column({ default: 'Pending' })
  complianceStatus: string; // Passed, Failed, Pending Incubation, Specification Verified

  @Column({ default: 'Locked' })
  qaReleaseStatus: string; // Released, Locked, Quarantined

  @CreateDateColumn()
  inspectionDate: Date; // System date tracking
}