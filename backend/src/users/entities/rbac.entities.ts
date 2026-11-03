import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user.entity';

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn({ name: 'user_id', type: 'integer' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'full_name', type: 'text' })
  fullName: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', default: 'ACTIVE' })
  status: AccountStatus;

  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;

  @Column({ name: 'updated_at', type: 'text' })
  updatedAt: string;
}

@Entity('roles')
export class RbacRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  code: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_system', type: 'integer', default: 0 })
  isSystem: number;

  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;
}

@Entity('permissions')
export class RbacPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;
}

@Entity('user_roles')
@Index('idx_user_roles_role', ['roleId'])
export class UserRole {
  @PrimaryColumn({ name: 'user_id', type: 'integer' })
  userId: number;

  @PrimaryColumn({ name: 'role_id', type: 'integer' })
  roleId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => RbacRole, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role: RbacRole;

  @Column({ name: 'assigned_at', type: 'text' })
  assignedAt: string;
}

@Entity('role_permissions')
@Index('idx_role_permissions_permission', ['permissionId'])
export class RolePermission {
  @PrimaryColumn({ name: 'role_id', type: 'integer' })
  roleId: number;

  @PrimaryColumn({ name: 'permission_id', type: 'integer' })
  permissionId: number;

  @ManyToOne(() => RbacRole, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: RbacRole;

  @ManyToOne(() => RbacPermission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: RbacPermission;
}

@Entity('audit_logs')
@Index('idx_audit_logs_actor', ['actorUserId'])
@Index('idx_audit_logs_created', ['createdAt'])
export class SecurityAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'actor_user_id', type: 'integer', nullable: true })
  actorUserId: number | null;

  @Column({ type: 'text' })
  action: string;

  @Column({ name: 'target_type', type: 'text' })
  targetType: string;

  @Column({ name: 'target_id', type: 'text', nullable: true })
  targetId: string | null;

  @Column({ type: 'text', nullable: true })
  metadata: string | null;

  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;
}
