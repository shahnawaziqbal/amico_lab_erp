import {
  ERP_MODULES,
  PERMISSION_CODES,
  ROLE_TEMPLATES,
  isPermissionCode,
  hasPermission,
} from './permission-catalog';

describe('ERP permission catalog', () => {
  it('contains exactly 15 modules', () => {
    expect(ERP_MODULES).toHaveLength(15);
  });

  it('contains no duplicate permission codes', () => {
    expect(new Set(PERMISSION_CODES).size)
      .toBe(PERMISSION_CODES.length);
  });

  it('provides a view permission for every module', () => {
    for (const module of ERP_MODULES) {
      expect(isPermissionCode(`${module}.view`)).toBe(true);
    }
  });

  it('never grants invalid permission codes through templates', () => {
    for (const codes of Object.values(ROLE_TEMPLATES)) {
      expect(new Set(codes).size).toBe(codes.length);
      for (const code of codes) {
        expect(isPermissionCode(code)).toBe(true);
      }
    }
  });

  it('restricts procurement officers from approvals', () => {
    const granted = ROLE_TEMPLATES.PROCUREMENT_OFFICER;
    expect(hasPermission(granted, 'procurement.view')).toBe(true);
    expect(hasPermission(granted, 'procurement.approve')).toBe(false);
  });

  it('restricts auditors to read-only access', () => {
    const granted = ROLE_TEMPLATES.AUDITOR;
    expect(granted.every(code => code.endsWith('.view'))).toBe(true);
    expect(hasPermission(granted, 'users.create')).toBe(false);
  });

  it('reserves role assignment for super administrators by default', () => {
    expect(
      hasPermission(ROLE_TEMPLATES.SUPER_ADMIN, 'users.assign_roles')
    ).toBe(true);

    expect(
      hasPermission(ROLE_TEMPLATES.ADMINISTRATOR, 'users.assign_roles')
    ).toBe(false);
  });
});
