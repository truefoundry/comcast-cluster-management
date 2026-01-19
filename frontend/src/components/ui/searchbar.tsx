import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface SearchbarProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
  iconClassName?: string
  containerClassName?: string
}

const Searchbar = React.forwardRef<HTMLInputElement, SearchbarProps>(
  (
    {
      className,
      placeholder = "Search...",
      onSearch,
      onChange,
      iconClassName,
      containerClassName,
      value,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      onSearch?.(e.target.value)
    }

    return (
      <div className={cn("relative", containerClassName)}>
        <Search
          className={cn(
            "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
            iconClassName
          )}
        />
        <Input
          type="search"
          className={cn("pl-9", className)}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Searchbar.displayName = "Searchbar"

export { Searchbar }
