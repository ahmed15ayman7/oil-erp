import { prisma } from "@/lib/prisma";
import { handleApiError, successResponse, ApiError } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { phone: { contains: search } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: {
              sales: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    // Calculate balance for each customer
    const customersWithBalance = await Promise.all(
      customers.map(async (customer) => {
        const sales = await prisma.sale.findMany({
          where: { customerId: customer.id },
          select: { total: true },
        });

        const balance = sales.reduce((sum, sale) => sum + sale.total, 0);

        return {
          ...customer,
          balance,
        };
      })
    );

    return successResponse({
      customers: customersWithBalance,
      total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      throw new ApiError("Unauthorized", 401);
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.phone || !data.type) {
      throw new ApiError("Missing required fields");
    }

    // Check if phone number is unique
    const existingCustomer = await prisma.customer.findFirst({
      where: { phone: data.phone },
    });

    if (existingCustomer) {
      throw new ApiError("رقم الهاتف مستخدم بالفعل");
    }

    const customer = await prisma.customer.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    });

    return successResponse(customer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      throw new ApiError("Unauthorized", 401);
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      throw new ApiError("Missing customer ID");
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new ApiError("Customer not found");
    }

    // Check if phone number is unique (excluding current customer)
    const phoneExists = await prisma.customer.findFirst({
      where: {
        phone: updateData.phone,
        NOT: { id },
      },
    });

    if (phoneExists) {
      throw new ApiError("رقم الهاتف مستخدم بالفعل");
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return successResponse(customer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      throw new ApiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new ApiError("Missing customer ID");
    }

    // Check if customer has any related sales
    const customerSales = await prisma.sale.findFirst({
      where: { customerId: id },
    });

    if (customerSales) {
      throw new ApiError("لا يمكن حذف العميل لوجود مبيعات مرتبطة به");
    }

    await prisma.customer.delete({
      where: { id },
    });

    return successResponse({ message: "Customer deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
