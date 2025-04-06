import NextAuth from 'next-auth'
import { authOptions } from '@/domains/user/utils/auth/options'

export default NextAuth(authOptions)
