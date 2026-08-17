import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ensureJsonFile } from '../common/utils/file-storage';
import { UserService } from '../user/user.service';
import { User } from '../user/user.model';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Session } from './models/session.model';
import { AuthResponse } from './models/auth-response.model';

@Injectable()
export class AuthService {
  private readonly sessionFilePath = join(
    process.cwd(),
    'src',
    'data',
    'sessions.json',
  );

  constructor(private readonly userService: UserService) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const user = await this.userService.create({
      id: uuidv4(),
      email: dto.email,
      name: dto.name,
      passwordHash: this.hashPassword(dto.password),
      walletBalanceCents: 0,
      createdAt: new Date().toISOString(),
    });

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(dto.email);

    if (!user || !this.verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.createAuthResponse(user);
  }

  async findUserByToken(token: string): Promise<User> {
    const sessions = await this.readSessions();
    const session = sessions.find(item => item.accessToken === token);

    if (!session) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    return this.userService.findById(session.userId);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponse> {
    const sessions = await this.readSessions();
    const sessionIndex = sessions.findIndex(
      item => item.refreshToken === dto.refreshToken,
    );

    if (sessionIndex === -1) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.userService.findById(sessions[sessionIndex].userId);
    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      accessToken: uuidv4(),
      refreshToken: uuidv4(),
      updatedAt: new Date().toISOString(),
    };

    await this.writeSessions(sessions);

    return {
      accessToken: sessions[sessionIndex].accessToken,
      refreshToken: sessions[sessionIndex].refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async logout(accessToken: string): Promise<void> {
    const sessions = await this.readSessions();
    const filteredSessions = sessions.filter(
      session => session.accessToken !== accessToken,
    );

    await this.writeSessions(filteredSessions);
  }

  sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private async createAuthResponse(user: User): Promise<AuthResponse> {
    const sessions = await this.readSessions();
    const accessToken = uuidv4();
    const refreshToken = uuidv4();
    const now = new Date().toISOString();

    sessions.push({
      accessToken,
      refreshToken,
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    });

    await this.writeSessions(sessions);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, encodedHash: string): boolean {
    const [salt, storedHash] = encodedHash.split(':');

    if (!salt || !storedHash) {
      return false;
    }

    const derivedHash = scryptSync(password, salt, 64);
    const originalHash = Buffer.from(storedHash, 'hex');

    if (derivedHash.length !== originalHash.length) {
      return false;
    }

    return timingSafeEqual(derivedHash, originalHash);
  }

  private async readSessions(): Promise<Session[]> {
    await ensureJsonFile(this.sessionFilePath, []);

    try {
      const raw = await fs.readFile(this.sessionFilePath, 'utf8');
      return JSON.parse(raw) as Session[];
    } catch {
      return [];
    }
  }

  private async writeSessions(sessions: Session[]): Promise<void> {
    await fs.writeFile(this.sessionFilePath, JSON.stringify(sessions, null, 2));
  }
}
