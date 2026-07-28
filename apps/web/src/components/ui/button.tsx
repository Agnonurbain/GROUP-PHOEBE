import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-accent-gold text-[#0A0A0A] hover:bg-accent-gold-hover",
        outline:
          "border-public-border bg-transparent text-public-text hover:bg-public-bg-elevated",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-accent-gold underline-offset-4 hover:underline",
        orange: "bg-accent-orange text-[#0A0A0A] hover:bg-accent-orange-hover",
        green: "bg-accent-green text-white hover:bg-accent-green-hover",
        blue: "bg-accent-blue text-white hover:bg-accent-blue-hover",
        "outline-white": "border-white/40 bg-black/40 text-white backdrop-blur-sm hover:bg-black/60",
        "text-link": "text-accent-gold underline-offset-2 hover:underline h-auto px-0 border-none bg-transparent",
        "icon": "size-8 text-public-text-muted hover:text-error hover:bg-error/10",
        admin: "bg-phoebe-green text-white hover:bg-phoebe-green-deep",
        "admin-ghost": "border border-phoebe-anthracite/20 text-phoebe-anthracite/70 hover:bg-phoebe-pearl",
        "admin-danger": "bg-error text-white hover:bg-bg-[#B91C1C]",
        "admin-icon": "bg-transparent text-phoebe-anthracite/70 hover:text-phoebe-anthracite hover:bg-phoebe-pearl p-2 rounded-lg inline-flex items-center justify-center min-h-11 min-w-11",
        "admin-alert": "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20",
        "admin-tab": "bg-transparent text-phoebe-anthracite/70 hover:text-phoebe-anthracite px-4 py-2 border-b-2 border-transparent hover:border-phoebe-anthracite/20 data-[active=true]:border-phoebe-gold data-[active=true]:text-phoebe-anthracite",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
