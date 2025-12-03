import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    await dbConnect();

                    if (!credentials?.email || !credentials?.password) {
                        throw new Error('Please provide email and password');
                    }

                    const user = await User.findOne({ email: credentials.email }).select('+password');

                    if (!user) {
                        throw new Error('Invalid credentials');
                    }

                    const isMatch = await user.matchPassword(credentials.password);

                    if (!isMatch) {
                        throw new Error('Invalid credentials');
                    }

                    return {
                        id: user._id.toString(),
                        _id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        image: user.picture,
                        role: user.role,
                        token: '', // Add token to satisfy type definition
                    };
                } catch (error) {
                    console.error("Login error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user._id;
                token.role = user.role;
                token.accessToken = user.token;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.accessToken = token.accessToken;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
    }
});

export { handler as GET, handler as POST };
