import type { Metadata } from 'next'
import { generateToolMetadata } from '@/lib/tools-metadata'

export const metadata: Metadata = generateToolMetadata('fib-4')

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
