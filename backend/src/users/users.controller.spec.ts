import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RbacService } from './permissions/rbac.service';

describe('UsersController', () => {
  let controller: UsersController;

  const usersServiceMock = {
    validateUser: jest.fn(),
    login: jest.fn(),
  };

  const rbacServiceMock = {
    getEffectivePermissions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersServiceMock },
        { provide: RbacService, useValue: rbacServiceMock },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
