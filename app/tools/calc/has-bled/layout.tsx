import type { Metadata } from 'next'
import { generateToolMetadata } from '@/lib/tools-metadata'

export const metadata: Metadata = generateToolMetadata('has-bled')

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
