import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { metricsHandler } from "./metrics"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  const config = new DocumentBuilder()
    .setTitle("Yeelo API")
    .setDescription("Homeopathy business API documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("/docs", app, document)

  app.getHttpAdapter().getInstance().get("/metrics", metricsHandler)
  await app.listen(process.env.PORT || 3001)
}
bootstrap()
