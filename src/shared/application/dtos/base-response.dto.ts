export class BaseResponse<T> {
  success: boolean;
  data?: T;
  message?: string | string[];

  private constructor(success: boolean, data?: T, message?: string | string[]) {
    this.success = success;
    this.data = data;
    this.message = message;
  }

  static ok<T>(data?: T, message?: string): BaseResponse<T> {
    return new BaseResponse<T>(true, data, message);
  }

  static fail<T = never>(message: string | string[]): BaseResponse<T> {
    return new BaseResponse<T>(false, undefined, message);
  }
}
