export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  error?: any;
}

export const successResponse = <T>(
  statusCode: number,
  message: string,
  data?: T
): ApiResponse<T> => {
  return {
    statusCode,
    message,
    data,
  };
};

export const errorResponse = (
  statusCode: number,
  message: string,
  error?: any
): ApiResponse => {
  return {
    statusCode,
    message,
    error,
  };
};
