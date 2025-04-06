import { useSession, signIn, signOut } from 'next-auth/react'

export default function Home() {
    const { data } = useSession()
    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <pre>{JSON.stringify(data, null, 2)}</pre>
            <div className={'flex flex-row gap-4'}>
                <button className={'bg-amber-300 text-black px-3 py-2'} onClick={() => signIn()}>
                    Sign in
                </button>
                <button className={'bg-amber-300 text-black px-3 py-2'} onClick={() => signOut()}>
                    Sign out
                </button>
            </div>
        </div>
    )
}
