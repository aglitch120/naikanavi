import type { Metadata } from 'next'
import { generateToolMetadata } from '@/lib/tools-metadata'

export const metadata: Metadata = generateToolMetadata('child-pugh')

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
