import { getServerSession, NextAuthOptions } from "next-auth";
import { ApiError } from "./api-error";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { Adapter } from "next-auth/adapters";
import { UserRole } from "@prisma/client";

export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new ApiError("Unauthorized", 401);
  }
  return session;
}

// export function checkPermissions(userRole: UserRole, allowedRoles: UserRole[]) {
//   if (!allowedRoles.includes(userRole)) {
//     throw new ApiError("Forbidden", 403);
//   }
// }

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Invalid credentials");
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          console.error("User not found");
          throw new Error("Invalid credentials");
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValid) {
          console.log("Invalid credentials");
          throw new Error("Invalid credentials");
        }
        console.log("User found");
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

export async function recordCheckIn(repId: string) {
  return await prisma.attendanceRecord.create({
    data: {
      repId,
      checkIn: new Date(),
    },
  });
}

export async function recordCheckOut(repId: string) {
  // البحث عن آخر سجل دخول بدون تسجيل خروج
  const lastAttendance = await prisma.attendanceRecord.findFirst({
    where: {
      repId,
      checkOut: null,
    },
    orderBy: {
      checkIn: "desc",
    },
  });

  if (!lastAttendance) {
    throw new Error("لا يوجد تسجيل دخول مفتوح");
  }

  return await prisma.attendanceRecord.update({
    where: {
      id: lastAttendance.id,
    },
    data: {
      checkOut: new Date(),
    },
  });
}

export async function verifyPassword(password: string, hash: string) {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password, hash }),
  });
  const data = await res.json();
  return data.match;
}

export async function getRepresentativeReport(
  repId: string,
  startDate: Date,
  endDate: Date
) {
  const [attendance, sales] = await Promise.all([
    // تقرير الحضور
    prisma.attendanceRecord.findMany({
      where: {
        repId,
        checkIn: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    // تقرير المبيعات
    prisma.sale.findMany({
      where: {
        repId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
      },
    }),
  ]);

  // حساب إحصائيات المبيعات
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const productsSold = sales.reduce(
    (sum, sale) =>
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  // حساب ساعات العمل
  const workingHours = attendance.reduce((total, record) => {
    if (!record.checkOut) return total;
    const hours =
      (record.checkOut.getTime() - record.checkIn.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);

  return {
    attendance,
    sales,
    summary: {
      totalSales,
      productsSold,
      workingHours,
      averageSalesPerHour: workingHours > 0 ? totalSales / workingHours : 0,
    },
  };
}
