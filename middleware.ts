import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: ['/admin/:path*'],
}

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization')

  if (authHeader) {
    const base64 = authHeader.replace('Basic ', '')
    const decoded = atob(base64)
    const [user, pass] = decoded.split(':')

    const validUser = process.env.ADMIN_USER || 'admin'
    const validPass = process.env.ADMIN_PASS || ''

    // パスワード未設定の場合はアクセス拒否
    if (validPass && user === validUser && pass === validPass) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="iwor 管理画面"',
    },
  })
}
