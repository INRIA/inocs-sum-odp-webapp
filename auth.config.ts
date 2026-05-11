import { defineConfig } from "auth-astro";
import Credentials from "@auth/core/providers/credentials";
import { AuthService } from "./src/bff/services/auth.service";

export default defineConfig({
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const authService = new AuthService();

        const result = await authService.login({
          email: credentials.email as string,
          password: credentials.password as string,
        });

        if (!result.success || !result.user) {
          throw new Error("Invalid credentials.");
        }

        if (result.user.status !== "active") {
          throw new Error(`pending-validation`);
        }

        // Return user data in the format expected by auth-astro
        return result.user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add userId and role_id to token on sign in
      if (user) {
        token.userId = user.id;
        token.role_id = (user as any).role_id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add userId and role_id to session object
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      if (token.role_id !== undefined) {
        (session.user as any).role_id = token.role_id;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
