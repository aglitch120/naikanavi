import NextImage from 'next/image'

interface MdxImageProps {
  src?: string
  alt?: string
  width?: number | string
  height?: number | string
}

export default function MdxImage({ src, alt = '', width, height }: MdxImageProps) {
  if (!src) return null

  const isSvg = src.endsWith('.svg')

  // SVGはNext.js Imageが最適化不可のため素のimgを使用
  if (isSvg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width as number || undefined}
        height={height as number || undefined}
        loading="lazy"
        className="w-full h-auto rounded-lg my-4"
      />
    )
  }

  // PNG/JPG/WebP: next/imageで自動最適化（WebP変換・srcset・lazy load）
  return (
    <span className="block my-4">
      <NextImage
        src={src}
        alt={alt}
        width={typeof width === 'number' ? width : 800}
        height={typeof height === 'number' ? height : 450}
        className="w-full h-auto rounded-lg"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 800px"
        loading="lazy"
      />
    </span>
  )
}
