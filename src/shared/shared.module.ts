import { Global, Module } from '@nestjs/common';

import { UNIT_OF_WORK } from './domain/interfaces/unit-of-work.interface';
import { TypeOrmUnitOfWork } from './infrastructure/typeorm-unit-of-work';

@Global()
@Module({
  providers: [{ provide: UNIT_OF_WORK, useClass: TypeOrmUnitOfWork }],
  exports: [UNIT_OF_WORK],
})
export class SharedModule {}
