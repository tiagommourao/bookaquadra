
import * as React from "react"
import { cn } from "@/lib/utils"

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {}

function Pagination({ className, ...props }: PaginationProps) {
  return (
    <div className={cn("flex justify-center", className)} {...props} />
  )
}

export { Pagination }
