import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GmbModule } from './gmb/gmb.module';
import { CommonModule } from './common/common.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                url: configService.get('DATABASE_URL') ||
                    'postgresql://postgres:postgres@localhost:5432/yeelo_homeopathy',
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: false, // Use migrations in production
                logging: false,
            }),
            inject: [ConfigService],
        }),
        CommonModule,
        GmbModule,
        // Add more modules here: EmailModule, SmsModule, etc.
    ],
})
export class AppModule { }
