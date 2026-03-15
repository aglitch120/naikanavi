import type { Metadata } from 'next'
import { generateToolMetadata } from '@/lib/tools-metadata'

export const metadata: Metadata = generateToolMetadata('wells-pe')

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
