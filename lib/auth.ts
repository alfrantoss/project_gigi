import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import * as bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password harus diisi');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            warga: true,
          },
        });

        if (!user) {
          throw new Error('Email atau password salah');
        }

        if (!user.isActive) {
          throw new Error('Akun Anda tidak aktif. Hubungi admin.');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Email atau password salah');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign in, add user data to token
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        console.log("JWT callback - User signed in:", { id: user.id, email: user.email, role: user.role });
      }
      
      // On update or other triggers, verify token has required data
      if (!token.id || !token.role) {
        console.warn("JWT token missing id or role:", token);
      }
      
      return token;
    },
    async session({ session, token }) {
      // Ensure session.user exists
      if (session?.user) {
        // Map token data to session
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        
        console.log("Session callback - Session created:", { 
          id: session.user.id, 
          email: session.user.email, 
          role: session.user.role 
        });
        
        // Validate session has required fields
        if (!session.user.id) {
          console.error("Session created without user ID! Token:", token);
        }
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
