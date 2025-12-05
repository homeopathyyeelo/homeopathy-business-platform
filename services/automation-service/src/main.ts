import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors();
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3006;
    await app.listen(port);

    Logger.log(`🚀 Automation Service running on port ${port}`, 'Bootstrap');
    Logger.log(`📍 GMB API: http://localhost:${port}/api/gmb/posts`, 'Bootstrap');
}
bootstrap();
