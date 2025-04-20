
import * as React from "react"
import {
  TooltipProvider,
  Tooltip as RadixTooltip,
  TooltipTrigger,
  TooltipContent
} from "@radix-ui/react-tooltip"

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
}

export function Tooltip({ children, content }: TooltipProps) {
  return (
    <TooltipProvider>
      <RadixTooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="bg-zinc-800 text-white px-2 py-1 rounded text-xs">
          {content}
        </TooltipContent>
      </RadixTooltip>
    </TooltipProvider>
  )
}
