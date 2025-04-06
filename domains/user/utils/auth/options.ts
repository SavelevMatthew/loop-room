import GithubProvider from 'next-auth/providers/github'
import { PrismaKVAdapter } from './adapter'
import type { AuthOptions } from 'next-auth'

const providers: AuthOptions['providers'] = []

declare module 'next-auth' {
    interface Session {
        user: {
            name?: string | null
            email?: string | null
            image?: string | null
            id: string // 👈 add this
        }
    }
}

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    providers.push(
        GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
        }),
    )
}

export const authOptions: AuthOptions = {
    providers,
    adapter: PrismaKVAdapter(),
    callbacks: {
        session({ session, user }) {
            session.user.id = user.id
            return session
        },
    },
}
