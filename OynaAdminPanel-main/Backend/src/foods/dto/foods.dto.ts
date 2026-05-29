import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateFoodDto {
  @IsString({ message: 'Ad mətn tipli olmalıdır.' })
  name: string;

  @IsString({ message: 'Kateqoriya mətn tipli olmalıdır.' })
  category: string;

  @IsNumber({}, { message: 'Qiymət rəqəm tipli olmalıdır.' })
  @Min(0, { message: 'Qiymət mənfi ola bilməz.' })
  price: number;

  @IsOptional()
  @IsString({ message: 'Təsvir mətn tipli olmalıdır.' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Şəkil linki mətn tipli olmalıdır.' })
  image?: string;
}

export class UpdateFoodDto {
  @IsOptional()
  @IsString({ message: 'Ad mətn tipli olmalıdır.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Kateqoriya mətn tipli olmalıdır.' })
  category?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Qiymət rəqəm tipli olmalıdır.' })
  @Min(0, { message: 'Qiymət mənfi ola bilməz.' })
  price?: number;

  @IsOptional()
  @IsString({ message: 'Təsvir mətn tipli olmalıdır.' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Şəkil linki mətn tipli olmalıdır.' })
  image?: string;
}
