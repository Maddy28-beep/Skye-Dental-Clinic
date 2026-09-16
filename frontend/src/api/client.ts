import { httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { functions } from '../firebase';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
  }
}

const STATUS_BY_CODE: Record<string, number> = {
  'invalid-argument': 400,
  unauthenticated: 401,
  'permission-denied': 403,
  'not-found': 404,
  'failed-precondition': 409,
  'resource-exhausted': 423,
};

// Thin wrapper around Cloud Functions callables so the rest of the app can keep catching
// a plain ApiError (same pattern as the old REST client), instead of every call site
// needing to know about Firebase's FunctionsError shape.
export async function callFunction<TResult = unknown, TData = unknown>(name: string, data?: TData): Promise<TResult> {
  try {
    const callable = httpsCallable<TData, TResult>(functions, name);
    const result: HttpsCallableResult<TResult> = await callable(data as TData);
    return result.data;
  } catch (err) {
    const code = (err as { code?: string })?.code?.replace('functions/', '') || '';
    const message = (err as Error)?.message || 'Something went wrong';
    throw new ApiError(message, STATUS_BY_CODE[code] || 400);
  }
}
