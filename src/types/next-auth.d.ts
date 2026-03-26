import { DefaultSession } from "next-auth";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      level?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    level?: number;
  }
}
