import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import getUserModel from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? ".mabilife.com" : undefined,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const User = await getUserModel();

          const existingUser = await User.findOne({ googleId: account.providerAccountId });

          if (!existingUser) {
            const newUser = new User({
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId,
            });
            await newUser.save();
          } else {
            // Update existing user info if needed
            existingUser.name = user.name || existingUser.name;
            existingUser.image = user.image || existingUser.image;
            await existingUser.save();
          }

          return true;
        } catch (error) {
          console.error("로그인 에러:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      // 로그인 시 또는 토큰에 userId가 없을 때 DB에서 조회
      if (account || !token.userId) {
        try {
          const User = await getUserModel();
          const googleId = account?.providerAccountId || token.sub;
          // Note: token.sub from Google is the googleId
          
          // If we don't have account (e.g. subsequent requests), we might need to find by googleId if stored in sub, 
          // but better to rely on what we stored. 
          // However, for the first sign in, account is present.
          
          if (googleId) {
             const dbUser = await User.findOne({ googleId });
             if (dbUser) {
               token.userId = dbUser._id.toString();
               token.level = dbUser.level;
             }
          }
        } catch (error) {
          console.error("JWT 콜백 에러:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.userId) {
          session.user.id = token.userId;
        }
        session.user.level = token.level;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function auth() {
  return getServerSession(authOptions);
}
