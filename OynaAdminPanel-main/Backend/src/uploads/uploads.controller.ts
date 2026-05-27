import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Param,
  BadRequestException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor() {
    console.log('--- UploadsController initialized ---');
  }

  @Get('test')
  test() {
    return { status: 'OK', message: 'Backend is updated! ' + Date.now() };
  }

  @Post(':category')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Param('category') category: string) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    formData.append('file', blob, file.originalname);
    formData.append('upload_preset', 'ml_default');
    formData.append('folder', category);

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/di8zz8sc1/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
      }

      return { url: data.secure_url };
    } catch (error) {
      this.logger.error('Cloudinary upload failed:', error.stack || error.message);
      throw new BadRequestException('Şəkil yüklənməsi zamanı xəta baş verdi.');
    }
  }
}
