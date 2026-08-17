import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join } from 'path';
import { User } from './user.model';
import { ensureJsonFile } from '../common/utils/file-storage';

@Injectable()
export class UserService {
  private readonly filePath = join(process.cwd(), 'src', 'data', 'users.json');

  async findAll(): Promise<User[]> {
    return this.readUsers();
  }

  async findById(id: string): Promise<User> {
    const users = await this.readUsers();
    const user = users.find(item => item.id === id);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const users = await this.readUsers();
    return users.find(
      user => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async create(user: User): Promise<User> {
    const users = await this.readUsers();

    if (
      users.some(
        item => item.email.toLowerCase() === user.email.toLowerCase(),
      )
    ) {
      throw new BadRequestException('User with this email already exists.');
    }

    users.push(user);
    await this.writeUsers(users);

    return user;
  }

  async update(userId: string, patch: Partial<User>): Promise<User> {
    const users = await this.readUsers();
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
      throw new NotFoundException('User not found.');
    }

    users[userIndex] = { ...users[userIndex], ...patch };
    await this.writeUsers(users);

    return users[userIndex];
  }

  private async readUsers(): Promise<User[]> {
    await ensureJsonFile(this.filePath, []);

    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(raw) as User[];
    } catch {
      return [];
    }
  }

  private async writeUsers(users: User[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(users, null, 2));
  }
}
