import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { db } from '@/domains/common/utils/db'
import { kv } from '@/domains/common/utils/kv'
import type { JwtPayload } from 'jsonwebtoken'
import type { IdentityProvider, User } from '@/domains/common/utils/db'
import type { Adapter, AdapterUser, AdapterAccount } from 'next-auth/adapters'

const SESSION_PREFIX = 'sess:'

const sessionSchema = z.strictObject({
    expires: z.string(),
    userId: z.string(),
})

type SessionPayload = z.infer<typeof sessionSchema>

export function PrismaKVAdapter(): Adapter {
    if (!process.env.AUTH_SECRET) throw new Error('AUTH_SECRET was not provided')

    function getAdapterUser(user: User): AdapterUser {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatar,
            emailVerified: null, // loop-room does not verify email by itself, it trusts verification from external providers
        }
    }

    function decodeToken(signedToken: string): string | null {
        let sessionToken: string | JwtPayload | undefined = undefined

        try {
            sessionToken = jwt.verify(signedToken, process.env.AUTH_SECRET!)
        } catch {
            /* empty */
        }

        if (!sessionToken || typeof sessionToken !== 'string') return null

        return sessionToken
    }

    async function getSessionFromSignedToken(
        signedToken: string,
    ): Promise<{ session: SessionPayload; sessionToken: string } | null> {
        const sessionToken = decodeToken(signedToken)
        if (!sessionToken) return null

        const sessionString = await kv.get(`${SESSION_PREFIX}${sessionToken}`)
        if (!sessionString) return null

        const { success, data: session } = sessionSchema.safeParse(JSON.parse(sessionString))
        if (!success) {
            return null
        }

        return { session, sessionToken }
    }

    return {
        async createUser(userData: Omit<AdapterUser, 'id'>): Promise<AdapterUser> {
            if (!userData.name) throw new Error('Cannot create user without name')

            const user = await db.user.create({
                data: {
                    name: userData.name,
                    email: userData.email,
                    avatar: userData.image,
                },
            })

            return getAdapterUser(user)
        },

        async getUser(id): Promise<AdapterUser | null> {
            const user = await db.user.findUnique({
                where: {
                    id,
                },
            })

            if (!user) return null

            return getAdapterUser(user)
        },

        async getUserByEmail(email): Promise<AdapterUser | null> {
            const user = await db.user.findUnique({
                where: {
                    email,
                },
            })

            if (!user) return null

            return getAdapterUser(user)
        },

        async getUserByAccount({ providerAccountId, provider }) {
            const identity = await db.userExternalIdentity.findUnique({
                where: {
                    provider_identityId: {
                        provider: provider as IdentityProvider,
                        identityId: providerAccountId,
                    },
                },
                include: { user: true },
            })

            const user = identity?.user

            if (!user) return null

            return getAdapterUser(user)
        },

        async updateUser(userData) {
            const { id, ...restData } = userData

            const user = await db.user.update({
                where: {
                    id,
                },
                data: {
                    email: restData.email,
                    name: restData.name || undefined,
                    avatar: restData.image,
                },
            })

            return getAdapterUser(user)
        },

        async deleteUser(id) {
            await db.user.delete({
                where: { id },
            })
        },

        async linkAccount(account: AdapterAccount) {
            await db.userExternalIdentity.create({
                data: {
                    provider: account.provider as IdentityProvider,
                    identityId: account.providerAccountId,
                    user: {
                        connect: { id: account.userId },
                    },
                },
            })
        },

        async unlinkAccount(account: Pick<AdapterAccount, 'providerAccountId' | 'provider'>) {
            await db.userExternalIdentity.delete({
                where: {
                    provider_identityId: {
                        provider: account.provider as IdentityProvider,
                        identityId: account.providerAccountId,
                    },
                },
            })
        },

        async createSession({ sessionToken, userId, expires }) {
            const ttlInMs = Math.max(Math.ceil(expires.getTime() - Date.now()), 0)
            const signedToken = jwt.sign(sessionToken, process.env.AUTH_SECRET!)
            const payload: SessionPayload = {
                expires: expires.toISOString(),
                userId,
            }
            await kv.set(`${SESSION_PREFIX}${sessionToken}`, JSON.stringify(payload), 'PX', ttlInMs)

            return {
                sessionToken: signedToken,
                userId,
                expires,
            }
        },

        async getSessionAndUser(signedToken) {
            const sessionData = await getSessionFromSignedToken(signedToken)

            if (!sessionData) return null

            const { session } = sessionData

            const user = await db.user.findUnique({
                where: { id: session.userId },
            })

            if (!user) return null

            return {
                session: {
                    userId: session.userId,
                    sessionToken: signedToken,
                    expires: new Date(session.expires),
                },
                user: getAdapterUser(user),
            }
        },

        async updateSession(partialSessionData) {
            const { sessionToken: signedToken, ...restData } = partialSessionData
            const sessionData = await getSessionFromSignedToken(signedToken)

            if (!sessionData) return null

            const { session, sessionToken } = sessionData

            const updatedPayload: SessionPayload = {
                userId: restData.userId || session.userId,
                expires: restData.expires?.toISOString() || session.expires,
            }

            const ttlInMs = Math.max(Math.ceil(Date.parse(updatedPayload.expires) - Date.now()), 0)

            await kv.set(`${SESSION_PREFIX}${sessionToken}`, JSON.stringify(updatedPayload), 'PX', ttlInMs)
        },

        async deleteSession(signedToken) {
            const sessionToken = decodeToken(signedToken)
            if (!sessionToken) return null

            await kv.del(`${SESSION_PREFIX}${sessionToken}`)
        },
    }
}
