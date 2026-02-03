import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
                secondary:
                    "border-transparent bg-gray-500/10 text-gray-400 hover:bg-gray-500/20",
                destructive:
                    "border-transparent bg-red-500/10 text-red-400 hover:bg-red-500/20",
                outline: "text-foreground",
                success: "border-transparent bg-green-500/10 text-green-400 hover:bg-green-500/20",
                warning: "border-transparent bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
