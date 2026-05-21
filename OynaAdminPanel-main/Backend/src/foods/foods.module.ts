import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FoodsController } from './foods.controller';
import { PublicFoodsController } from './public-foods.controller';
import { FoodsService } from './foods.service';
import { Food, FoodSchema } from './schemas/food.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Food.name, schema: FoodSchema }]),
  ],
  controllers: [FoodsController, PublicFoodsController],
  providers: [FoodsService],
  exports: [FoodsService],
})
export class FoodsModule {}
