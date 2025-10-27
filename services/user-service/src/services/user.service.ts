import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class UserService {
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: UserRole;
    shopId?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    return await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword, // Note: In real implementation, store hashed password
        name: userData.name,
        phone: userData.phone,
        role: userData.role || UserRole.STAFF,
        shopId: userData.shopId,
      },
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        shop: true,
        orders: true,
      },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        shop: true,
      },
    });
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async getUsersByShop(shopId: string): Promise<User[]> {
    return await prisma.user.findMany({
      where: { shopId },
      include: {
        orders: true,
      },
    });
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await prisma.user.findMany({
      where: { role },
      include: {
        shop: true,
      },
    });
  }
}

export class AuthService {
  private userService: UserService;
  private jwtSecret: string;

  constructor() {
    this.userService = new UserService();
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      return null;
    }

    // In real implementation, verify hashed password
    const isValidPassword = await bcrypt.compare(password, user.password || '');

    if (!isValidPassword) {
      return null;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        shopId: user.shopId,
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    return { user, token };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return await this.userService.getUserById(decoded.userId);
    } catch (error) {
      return null;
    }
  }
}
