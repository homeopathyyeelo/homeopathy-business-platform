import { Controller, Post, Get, Body, Param, HttpCode } from '@nestjs/common';
import { GmbService, CreatePostDto } from './gmb.service';

@Controller('gmb')
export class GmbController {
    constructor(private readonly gmbService: GmbService) { }

    @Post('posts')
    @HttpCode(200)
    async createPost(@Body() dto: CreatePostDto) {
        const post = await this.gmbService.createPost(dto);
        return {
            success: true,
            data: post,
            message: 'Post created and publishing to GMB',
        };
    }

    @Get('posts')
    async getAllPosts() {
        const posts = await this.gmbService.getAllPosts();
        return {
            success: true,
            data: posts,
        };
    }

    @Get('posts/:id')
    async getPost(@Param('id') id: string) {
        const post = await this.gmbService.getPostById(id);
        return {
            success: true,
            data: post,
        };
    }
}
