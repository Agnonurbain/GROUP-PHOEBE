import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-accent-gold/15 text-accent-gold",
        gold: "bg-accent-gold/15 text-accent-gold",
        orange: "bg-accent-orange/15 text-accent-orange",
        green: "bg-accent-green/15 text-accent-green",
        blue: "bg-accent-blue/15 text-accent-blue-on-dark",
        outline: "border-public-border text-public-text-muted",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-error/10 text-error",
        "admin-green": "bg-phoebe-green/10 text-phoebe-green-deep",
        "admin-gold": "bg-phoebe-gold/15 text-phoebe-gold-dark",
        "admin-error": "bg-error/10 text-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
