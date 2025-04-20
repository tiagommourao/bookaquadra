
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = ({ children, content }: {
  children: React.ReactNode
  content: React.ReactNode
}) => {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          className="bg-zinc-800 text-white px-2 py-1 rounded text-xs"
          sideOffset={4}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-zinc-800" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  )
}

export { Tooltip, TooltipProvider, TooltipPrimitive as TooltipRoot, TooltipPrimitive.Trigger as TooltipTrigger, TooltipPrimitive.Content as TooltipContent }
