export interface ResultSuccess<T> {
  success: true;
  data: T;
}

export interface ResultFailure<E> {
  success: false;
  error: E;
}

export type Result<T, E = Error> = ResultSuccess<T> | ResultFailure<E>;

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is ResultSuccess<T> {
  return result.success === true;
}

export function isErr<T, E>(result: Result<T, E>): result is ResultFailure<E> {
  return result.success === false;
}
