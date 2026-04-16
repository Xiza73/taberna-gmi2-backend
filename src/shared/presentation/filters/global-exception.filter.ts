import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable, Logger } from '@nestjs/common';
import { type Response } from 'express';

import { BaseResponse } from '../../application/dtos/base-response.dto.js';
import {
  DomainConflictException,
  DomainException,
  DomainForbiddenException,
  DomainNotFoundException,
  DomainUnauthorizedException,
} from '../../domain/exceptions/index.js';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: string | string[];

    if (exception instanceof DomainUnauthorizedException) {
      status = 401;
      message = exception.message;
    } else if (exception instanceof DomainNotFoundException) {
      status = 404;
      message = exception.message;
    } else if (exception instanceof DomainForbiddenException) {
      status = 403;
      message = exception.message;
    } else if (exception instanceof DomainConflictException) {
      status = 409;
      message = exception.message;
    } else if (exception instanceof DomainException) {
      status = 400;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as Record<string, unknown>;
      message = Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message as string[]
        : (exceptionResponse.message as string) || (exceptionResponse as unknown as string);
    } else {
      status = 500;
      message = 'Internal server error';
      this.logger.error('Unhandled exception', exception);
    }

    response.status(status).json(BaseResponse.fail(message));
  }
}
