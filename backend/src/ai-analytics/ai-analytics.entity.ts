import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ai_analytics_models')
export class AiModelMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  modelName: string; // e.g., 'CLTV Catalyst Predictor'

  @Column()
  metricType: string; // e.g., 'Demand Forecasting', 'Customer Churn'

  @Column('float')
  accuracyScore: number; // e.g., 0.95

  @Column({ default: 'Active' })
  status: string; // Active, Training, Deprecated

  @CreateDateColumn()
  lastUpdated: Date;
}