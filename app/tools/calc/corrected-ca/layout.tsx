import type { Metadata } from 'next'
import { generateToolMetadata } from '@/lib/tools-metadata'

export const metadata: Metadata = generateToolMetadata('corrected-ca')

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
