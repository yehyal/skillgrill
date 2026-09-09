import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

export function GuideMarkdown({ content, slug }: { content: string; slug: string }) {
  return (
    <div
      className={cn(
        "max-w-[70ch] text-[0.9375rem] leading-7 text-foreground",
        "[&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline",
        "[&_blockquote]:my-5 [&_blockquote]:border-l [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
        "[&_code]:font-mono [&_code]:text-[0.8125rem]",
        "[&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight",
        "[&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-tight",
        "[&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:leading-tight",
        "[&_h5]:mt-5 [&_h5]:font-semibold [&_h6]:mt-5 [&_h6]:font-semibold",
        "[&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal [&_ol]:my-4 [&_ul]:my-4 [&_ul]:space-y-1",
        "[&_p]:my-4 [&_pre]:my-5 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-sm [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/30 [&_pre]:p-4 [&_pre]:leading-6",
        "[&_table]:my-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2",
        "[&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full"
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url, key) =>
          key === "src" ? getGuideImageUrl(url, slug) ?? "" : getSafeGuideUrl(url) ?? ""
        }
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          img: ({ src, alt }) => {
            const safeSrc = getGuideImageUrl(src, slug)

            if (!safeSrc || !alt?.trim()) {
              return null
            }

            return <Image src={safeSrc} alt={alt} width={1200} height={675} />
          },
          a: ({ children, href }) => {
            const safeHref = getSafeGuideUrl(href)

            if (!safeHref) {
              return <span>{children}</span>
            }

            const isExternal = /^https?:\/\//i.test(safeHref)

            return (
              <a
                href={safeHref}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function getSafeGuideUrl(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const url = value.trim()

  if (/^[a-z][a-z\d+.-]*:/i.test(url)) {
    return /^(?:https?:|mailto:|tel:)/i.test(url) ? url : null
  }

  return url.startsWith("//") || /[\u0000-\u001f\\]/.test(url) ? null : url
}

function getGuideImageUrl(value: unknown, slug: string) {
  if (typeof value !== "string" || !value) {
    return null
  }

  const basePath = `/guides/${slug}/`
  const imagePath = value.startsWith("./")
    ? `${basePath}${value.slice(2)}`
    : value.startsWith("/")
      ? value
      : `${basePath}${value}`

  if (!imagePath.startsWith(basePath) || imagePath.includes("..") || /[\u0000-\u001f\\]/.test(imagePath)) {
    return null
  }

  return imagePath
}
