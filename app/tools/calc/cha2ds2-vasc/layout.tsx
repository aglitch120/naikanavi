import type { Metadata } from 'next'
import { generateToolMetadata } from '@/lib/tools-metadata'

export const metadata: Metadata = generateToolMetadata('cha2ds2-vasc')

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
