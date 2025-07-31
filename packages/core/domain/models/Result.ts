export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  ok: true;
  value: T;
}

export interface Failure<E> {
  ok: false;
  error: E;
}

// Type guard functions
export function isSuccess<T, E = Error>(result: Result<T, E>): result is Success<T> {
  return result.ok === true;
}

export function isFailure<T, E = Error>(result: Result<T, E>): result is Failure<E> {
  return result.ok === false;
} 