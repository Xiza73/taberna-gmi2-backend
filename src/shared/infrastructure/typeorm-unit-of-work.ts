import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { type IUnitOfWork, type TransactionContext } from '../domain/interfaces/unit-of-work.interface.js';

@Injectable()
export class TypeOrmUnitOfWork implements IUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  async execute<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
