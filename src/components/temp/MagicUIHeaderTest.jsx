import * as React from "react";
// If you have a utility for classnames, import it. Otherwise, use a fallback.
// import { cn } from "@/lib/utils";
// For this experiment, define a simple cn fallback:
const cn = (...classes) => classes.filter(Boolean).join(' ');
// If you have a Card component from shadcn/ui, import it. Otherwise, use a div as fallback.
// import { Card } from "@/components/ui/card";
const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-md", className)} {...props}>
    {children}
  </div>
));
Card.displayName = "Card";

/**
 * @typedef {Object} StickyHeaderCardProps
 * @property {React.ReactNode} [children]
 */

const StickyHeaderCard = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-lg shadow-md",
          className
        )}
        {...props}
      >
        <div className="p-4">
          {children || <p className="text-gray-900 font-medium">Magic UI Header Content</p>}
        </div>
      </Card>
    );
  }
);

StickyHeaderCard.displayName = "StickyHeaderCard";

export function StickyHeaderCardDemo() {
  return (
    <div className="min-h-screen w-full bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <StickyHeaderCard />
        {/* Content below the sticky header */}
        {Array.from({ length: 20 }).map((_, i) => (
          <Card key={i} className="p-4">
            <p className="text-gray-900">Scroll content item {i + 1}</p>
            <p className="text-gray-500 text-sm">
              This content demonstrates the sticky header effect as you scroll.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default StickyHeaderCardDemo; 