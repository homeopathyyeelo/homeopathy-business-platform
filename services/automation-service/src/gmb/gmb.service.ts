import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GmbPost } from './entities/gmb-post.entity';
import { BrowserService } from '../common/browser.service';

export interface CreatePostDto {
    accountId: string;
    title: string;
    content: string;
    scheduledFor?: Date;
}

@Injectable()
export class GmbService {
    private readonly logger = new Logger(GmbService.name);

    constructor(
        @InjectRepository(GmbPost)
        private postRepository: Repository<GmbPost>,
        private browserService: BrowserService,
    ) { }

    async createPost(dto: CreatePostDto): Promise<GmbPost> {
        const post = this.postRepository.create({
            ...dto,
            status: 'PUBLISHING',
        });

        const savedPost = await this.postRepository.save(post);

        // Publish in background
        this.publishPost(savedPost).catch(err => {
            this.logger.error(`Failed to publish post ${savedPost.id}: ${err.message}`);
        });

        return savedPost;
    }

    private async publishPost(post: GmbPost): Promise<void> {
        try {
            this.logger.log(`Publishing post ${post.id} to GMB...`);

            const result = await this.browserService.publishToGMB({
                title: post.title,
                content: post.content,
            });

            if (result.success) {
                await this.postRepository.update(post.id, {
                    status: 'PUBLISHED',
                    publishedAt: new Date(),
                    postUrl: result.url || 'https://business.google.com',
                });
                this.logger.log(`✅ Post ${post.id} published successfully`);
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error: any) {
            this.logger.error(`❌ Failed to publish post ${post.id}: ${error.message}`);

            await this.postRepository.update(post.id, {
                status: 'FAILED',
                errorMessage: error.message,
            });
        }
    }

    async getAllPosts(): Promise<GmbPost[]> {
        return this.postRepository.find({
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async getPostById(id: string): Promise<GmbPost> {
        return this.postRepository.findOne({ where: { id } });
    }
}
