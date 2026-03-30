import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { Account, Role } from './entities/account.entity';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { DailyMoodCheckin } from './entities/daily-mood-checkin.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockAccountRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockProfileRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDailyMoodRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAccountRepo.findOne.mockResolvedValue({
      id: 'admin-id',
      role: Role.SUPERADMIN,
      email: 'admin@test.com',
      password: 'hashed',
    });
    mockAccountRepo.save.mockImplementation(async (x: unknown) => x);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepo,
        },
        {
          provide: getRepositoryToken(EmployeeProfile),
          useValue: mockProfileRepo,
        },
        {
          provide: getRepositoryToken(DailyMoodCheckin),
          useValue: mockDailyMoodRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
