import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}

declare module "@auth/prisma-adapter" {
  interface AdapterUser extends DefaultUser {
    role: string;
  }
}
