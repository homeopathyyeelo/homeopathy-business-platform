import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(role?: string) {
    const query = this.userRepository.createQueryBuilder('user');
    
    if (role) {
      query.where('user.role = :role', { role });
    }

    const users = await query.getMany();

    return {
      success: true,
      data: users.map(user => this.sanitizeUser(user)),
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: this.sanitizeUser(user),
    };
  }

  async update(id: string, updateData: Partial<User>) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Don't allow password update through this endpoint
    delete updateData.password;

    Object.assign(user, updateData);
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'User updated successfully',
      data: this.sanitizeUser(user),
    };
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete - just deactivate
    user.isActive = false;
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'User deactivated successfully',
    };
  }

  private sanitizeUser(user: User) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
