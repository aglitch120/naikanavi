'use client'

import { AnchorHTMLAttributes, ReactNode } from 'react'

interface MdxLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode
}

export default function MdxLink({ children, ...props }: MdxLinkProps) {
  return (
    <a {...props}>
      {children}
    </a>
  )
}
