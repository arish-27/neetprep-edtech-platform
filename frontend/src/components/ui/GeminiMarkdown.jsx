import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/cn";
/**
 * Renders Gemini AI markdown responses.
 * No className on ReactMarkdown (v9 removed it) — wrap in div instead.
 */
export function GeminiMarkdown({ content, className, }) {
    return (<div className={cn("space-y-2 text-sm leading-relaxed", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            // Headings
            h1: ({ children }) => (<p className="text-sm font-extrabold text-white mt-2 mb-1">{children}</p>),
            h2: ({ children }) => (<p className="text-sm font-extrabold text-white mt-2 mb-1">{children}</p>),
            h3: ({ children }) => (<p className="text-sm font-bold text-ink-100 mt-1.5 mb-0.5">{children}</p>),
            // Paragraph
            p: ({ children }) => (<p className="text-sm text-ink-100 leading-relaxed mb-1.5 last:mb-0">{children}</p>),
            // Bold
            strong: ({ children }) => (<strong className="font-extrabold text-white">{children}</strong>),
            // Italic
            em: ({ children }) => (<em className="italic text-ink-200">{children}</em>),
            // Unordered list
            ul: ({ children }) => (<ul className="my-1.5 space-y-1 pl-1">{children}</ul>),
            // Ordered list
            ol: ({ children }) => (<ol className="my-1.5 space-y-1 pl-4 list-decimal">{children}</ol>),
            // List item
            li: ({ children }) => (<li className="flex items-start gap-2 text-sm text-ink-100 leading-relaxed list-none">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-byjus-400"/>
              <span className="flex-1">{children}</span>
            </li>),
            // Inline code
            code: ({ children, className: cls }) => {
                const isBlock = Boolean(cls?.includes("language-"));
                if (isBlock) {
                    return (<pre className="my-2 overflow-x-auto rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs font-mono text-emerald-300">
                  <code>{children}</code>
                </pre>);
                }
                return (<code className="rounded-md bg-white/15 px-1.5 py-0.5 text-xs font-mono text-byjus-300">
                {children}
              </code>);
            },
            // Blockquote
            blockquote: ({ children }) => (<blockquote className="my-2 border-l-2 border-byjus-400 pl-3 text-sm italic text-ink-300">
              {children}
            </blockquote>),
            // HR
            hr: () => <hr className="my-2 border-white/10"/>,
            // Table
            table: ({ children }) => (<div className="my-2 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-xs">{children}</table>
            </div>),
            thead: ({ children }) => (<thead className="bg-white/10 text-ink-200">{children}</thead>),
            tbody: ({ children }) => (<tbody className="divide-y divide-white/5">{children}</tbody>),
            tr: ({ children }) => <tr>{children}</tr>,
            th: ({ children }) => (<th className="px-3 py-2 text-left font-extrabold text-ink-100">{children}</th>),
            td: ({ children }) => (<td className="px-3 py-2 text-ink-300">{children}</td>),
        }}>
        {content}
      </ReactMarkdown>
    </div>);
}
