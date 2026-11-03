import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type UserListItem = {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  status: string | null;
  roles: string[];
};

type UserRow = {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  status: string | null;
  roleCodes: string | null;
};

@Injectable()
export class UserListService {
  constructor(private readonly dataSource: DataSource) {}

  async list(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const countRows: Array<{ total: number }> =
      await this.dataSource.query(
        'SELECT COUNT(*) AS total FROM users',
      );

    const rows: UserRow[] = await this.dataSource.query(
      `SELECT
         u.id AS id,
         u.username AS username,
         up.full_name AS fullName,
         up.email AS email,
         up.status AS status,
         GROUP_CONCAT(DISTINCT r.code) AS roleCodes
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       GROUP BY
         u.id, u.username, up.full_name, up.email, up.status
       ORDER BY u.id ASC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    const users: UserListItem[] = rows.map((row) => ({
      id: row.id,
      username: row.username,
      fullName: row.fullName,
      email: row.email,
      status: row.status,
      roles: row.roleCodes
        ? row.roleCodes.split(',').sort()
        : [],
    }));

    return {
      page,
      limit,
      total: Number(countRows[0]?.total ?? 0),
      users,
    };
  }
}
