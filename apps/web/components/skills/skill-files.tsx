"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { CheckIcon, ClipboardIcon } from "@radix-ui/react-icons"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { SkillFile } from "@skill-grill/shared"

import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type FileView = "preview" | "source"

export function SkillFiles({ files }: { files: SkillFile[] }) {
  const file = files.find((entry) => entry.path === "SKILL.md")
  const [view, setView] = useState<FileView>("preview")
  const [copied, setCopied] = useState(false)
  const copiedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copiedResetTimer.current) {
        clearTimeout(copiedResetTimer.current)
      }
    }
  }, [])

  async function copySource() {
    if (!file) {
      return
    }

    try {
      await navigator.clipboard.writeText(file.contents)
      setCopied(true)

      if (copiedResetTimer.current) {
        clearTimeout(copiedResetTimer.current)
      }

      copiedResetTimer.current = setTimeout(() => {
        setCopied(false)
        copiedResetTimer.current = null
      }, 1600)
      toast.success("Source copied")
    } catch {
      setCopied(false)
      toast.error("Could not copy source", {
        description: "Your browser did not grant clipboard access.",
      })
    }
  }

  return (
    <section className="border-t border-border py-6" aria-labelledby="files-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Files</p>
          <h2 id="files-title" className="mt-2 text-xl font-semibold">SKILL.md</h2>
        </div>
        {file ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label={copied ? "Skill source copied" : "Copy skill source"}
            title={copied ? "Skill source copied" : "Copy skill source"}
            onClick={() => void copySource()}
          >
            {copied ? <CheckIcon aria-hidden="true" /> : <ClipboardIcon aria-hidden="true" />}
            {copied ? "Copied" : "Copy source"}
          </Button>
        ) : null}
      </div>

      {file ? (
        <>
          <div className="mt-5 flex gap-1 border-b border-border" role="group" aria-label="Skill file view">
            <FileViewTab active={view === "preview"} onClick={() => setView("preview")}>
              Preview
            </FileViewTab>
            <FileViewTab active={view === "source"} onClick={() => setView("source")}>
              Source
            </FileViewTab>
          </div>

          <div
            id={`skill-file-${view}`}
            className="mt-5 min-w-0 max-h-[36rem] overflow-auto rounded-sm pr-2"
            role="region"
            aria-label={`${view === "preview" ? "Preview" : "Source"} of SKILL.md`}
            tabIndex={0}
          >
            {view === "preview" ? (
              <SkillMarkdown contents={stripFrontmatter(file.contents)} />
            ) : (
              <pre className="max-h-[34rem] overflow-auto border border-border bg-muted/30 p-4 text-xs leading-6 text-foreground">
                <code className="font-mono">{file.contents}</code>
              </pre>
            )}
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The source file has not been added to this skill yet.
        </p>
      )}
    </section>
  )
}

function FileViewTab({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "border-b-2 px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function SkillMarkdown({ contents }: { contents: string }) {
  if (!contents.trim()) {
    return <p className="text-sm text-muted-foreground">This file has no previewable content.</p>
  }

  return (
    <div className="max-w-[70ch] text-sm leading-7 text-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline [&_blockquote]:border-l [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:font-mono [&_code]:text-[0.8125rem] [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:leading-tight [&_h4]:mt-5 [&_h4]:font-semibold [&_h5]:mt-4 [&_h5]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal [&_p]:mt-4 [&_pre]:mt-4 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/30 [&_pre]:p-4 [&_pre]:leading-6 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_ul]:mt-3 [&_ul]:space-y-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => getSafeMarkdownUrl(url) ?? ""}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          h2: ({ children }) => <h3>{children}</h3>,
          h3: ({ children }) => <h4>{children}</h4>,
          h4: ({ children }) => <h5>{children}</h5>,
          h5: ({ children }) => <h6>{children}</h6>,
          h6: ({ children }) => (
            <p role="heading" aria-level={6} className="mt-4 font-semibold">
              {children}
            </p>
          ),
          a: ({ children, href }) => {
            const safeHref = getSafeMarkdownUrl(href)

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
          img: () => null,
        }}
      >
        {contents}
      </ReactMarkdown>
    </div>
  )
}

function stripFrontmatter(contents: string) {
  const match = contents.match(/^---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/)
  return match ? contents.slice(match[0].length) : contents
}

function getSafeMarkdownUrl(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const url = value.trim()

  return /^(?:https?:|mailto:|tel:)/i.test(url)
    ? url
    : null
}
