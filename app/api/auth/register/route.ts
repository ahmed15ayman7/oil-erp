import { prisma } from '@/lib/prisma';
import { hash } from 'bcrypt';
import { ApiError, handleApiError, successResponse } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.email || !data.password || !data.name || !data.role) {
      throw new ApiError('جميع الحقول مطلوبة');
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ApiError('البريد الإلكتروني مستخدم بالفعل');
    }

    // Hash password
    const hashedPassword = await hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}
