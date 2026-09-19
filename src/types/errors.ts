/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_FAILED'
  | 'DELETE_RESTRICTED'
  | 'LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

export interface AppError {
  code: AppErrorCode | string;
  message: string;
  reason?: string;
  limitName?: string;
}

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN';

  constructor(
    message: string,
    public readonly requiredRole?: string,
    public readonly capability?: string
  ) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class AuthenticationError extends Error {
  readonly code = 'UNAUTHENTICATED';

  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}
