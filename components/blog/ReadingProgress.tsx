'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const article = document.querySelector('article')
      if (!article) return

      const rect = article.getBoundingClientRect()
      const articleTop = rect.top + window.scrollY
      const articleHeight = article.offsetHeight
      const windowHeight = window.innerHeight
      const scrollY = window.scrollY

      // 記事の開始位置から終了位置までの進捗
      const start = articleTop
      const end = articleTop + articleHeight - windowHeight
      const current = scrollY - start

      if (current <= 0) {
        setProgress(0)
      } else if (current >= end - start) {
        setProgress(100)
      } else {
        setProgress(Math.round((current / (end - start)) * 100))
      }
    }

    window.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  if (progress === 0) return null

  return (
    <div className="fixed top-14 left-0 right-0 z-40 h-0.5 bg-br/30">
      <div
        className="h-full bg-ac transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="読了進捗"
      />
    </div>
  )
}
