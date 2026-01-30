/**
 * Helper functions for API routes
 */

import { NextRequest } from 'next/server';
import { getAuthToken, verifyToken, TokenPayload } from './auth';
import { AuthenticationError, AuthorizationError } from './errors';

/**
 * Validates authentication and returns user payload
 */
export async function requireAuth(req: NextRequest): Promise<TokenPayload> {
  const token = getAuthToken(req);
  
  if (!token) {
    throw new AuthenticationError();
  }
  
  const payload = verifyToken(token);
  
  if (!payload) {
    throw new AuthenticationError('Neispravan token');
  }
  
  return payload;
}

/**
 * Validates authentication and requires admin role
 */
export async function requireAdmin(req: NextRequest): Promise<TokenPayload> {
  const payload = await requireAuth(req);
  
  if (payload.role !== 'admin') {
    throw new AuthorizationError();
  }
  
  return payload;
}

/**
 * Creates a query object from search params
 */
export function createQueryFromParams(
  searchParams: URLSearchParams,
  allowedParams: string[]
): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  
  for (const param of allowedParams) {
    const value = searchParams.get(param);
    if (value !== null) {
      // Try to parse as number or boolean
      if (value === 'true') {
        query[param] = true;
      } else if (value === 'false') {
        query[param] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        query[param] = Number(value);
      } else {
        query[param] = value;
      }
    }
  }
  
  return query;
}
