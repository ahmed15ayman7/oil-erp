import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  );
}

export function successResponse(data: any) {
  return NextResponse.json(data);
}
