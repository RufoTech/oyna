import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<unknown, Types.ObjectId> {
  transform(value: unknown): Types.ObjectId {
    const isValid = typeof value === 'string' && Types.ObjectId.isValid(value);
    if (!isValid) {
      throw new BadRequestException('Göndərilən ID formatı keçərsizdir.');
    }
    return new Types.ObjectId(value as string);
  }
}
