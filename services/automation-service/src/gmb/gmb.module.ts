import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GmbController } from './gmb.controller';
import { GmbService } from './gmb.service';
import { GmbPost } from './entities/gmb-post.entity';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([GmbPost]),
        CommonModule,
    ],
    controllers: [GmbController],
    providers: [GmbService],
    exports: [GmbService],
})
export class GmbModule { }
