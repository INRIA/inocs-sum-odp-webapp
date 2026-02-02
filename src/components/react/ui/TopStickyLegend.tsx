import React, { useEffect, useRef, useState } from "react";

/**
 * Represents an individual legend item with label and color
 */
export interface ILegendItem {
  id: string;
  label: string;
  color: string;
}

/**
 * Props for the TopStickyLegend component
 * Following Interface Segregation Principle - clients can use only what they need
 */
export interface TopStickyLegendProps {
  /** Optional section id for navigation purposes */
  id?: string;
  /** Optional title displayed before legend items (e.g., "Living Labs:") */
  title?: string;
  /** Array of legend items with id, label, and color */
  items?: ILegendItem[];
  /** Optional children to render alongside or instead of items */
  children?: React.ReactNode;
  /** Optional custom className for the container */
  className?: string;
  /** Optional z-index for sticky positioning (default: 40) */
  stickyZIndex?: number;
  /** Optional id of the boundary element - legend disappears when scrolled past this element */
  boundaryElementId?: string;
}

/**
 * A reusable legend component that sticks to the top of the viewport when scrolled past.
 * When user scrolls back up past its original position, it returns to normal flow.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles sticky legend display logic
 * - Open/Closed: Extensible via children prop without modifying component
 * - Liskov Substitution: N/A (no inheritance)
 * - Interface Segregation: All props are optional, use only what you need
 * - Dependency Inversion: No external dependencies, pure React
 */
export const TopStickyLegend: React.FC<TopStickyLegendProps> = ({
  id,
  title,
  items = [],
  children,
  className = "",
  stickyZIndex = 40,
  boundaryElementId,
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Store the original top position when the component mounts
    const originalTop = section.getBoundingClientRect().top + window.scrollY;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const sectionHeight = section.offsetHeight;

      // Check if we should hide based on boundary element
      if (boundaryElementId) {
        const boundaryElement = document.getElementById(boundaryElementId);
        if (boundaryElement) {
          const boundaryRect = boundaryElement.getBoundingClientRect();
          const boundaryBottom = boundaryRect.bottom + window.scrollY;
          // Hide when the bottom of the boundary element is above the viewport top + legend height
          setIsVisible(scrollY + sectionHeight < boundaryBottom);
        }
      }

      // When scroll position passes the original top position, make it sticky
      setIsSticky(scrollY >= originalTop);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [boundaryElementId]);

  // Get the height of the section for the placeholder
  const sectionHeight = sectionRef.current?.offsetHeight ?? 0;

  // Don't render if not visible (scrolled past boundary)
  if (!isVisible && isSticky) {
    return null;
  }

  return (
    <>
      {/* Placeholder to prevent layout shift when section becomes sticky */}
      {isSticky && (
        <div
          ref={placeholderRef}
          style={{ height: sectionHeight }}
          aria-hidden="true"
        />
      )}

      <section
        ref={sectionRef}
        id={id}
        className={`
          transition-shadow duration-200
          ${isSticky ? `fixed top-0 left-0 right-0 shadow-md` : ""}
          ${className}
        `.trim()}
        style={isSticky ? { zIndex: stickyZIndex } : undefined}
      >
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-1 lg:p-4">
          <div className="flex flex-wrap items-center gap-2 lg:gap-4">
            {title && (
              <span className="w-full text-sm font-medium text-gray-700">
                {title}
              </span>
            )}

            {/* Render legend items */}
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-0.5 lg:gap-1">
                <span
                  className="w-4 h-1 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
            ))}

            {/* Render any additional children */}
            {children}
          </div>
        </div>
      </section>
    </>
  );
};
