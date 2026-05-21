import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import compression from 'compression';

// Deployment trigger v3: VPS restarted, testing SSH connection again - 21.04.2026
// Deployment trigger v4: Simulation backend updates - 26.04.2026
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(compression());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();