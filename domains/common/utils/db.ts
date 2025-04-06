import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient()

export type * from '@prisma/client'
