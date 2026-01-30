import React, { useEffect, useState } from "react";

interface Section {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  /** Optional custom action. If provided, onClick will be called instead of scrolling to the section */
  onClick?: () => void;
}

interface PageNavigationProps {
  sections: Section[];
  disclaimer?: string;
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  sections,
  disclaimer,
}) => {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id);

  useEffect(() => {
    // Create Intersection Observer to track which section is visible
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // Trigger when section is ~20% from top
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    // Observe all sections
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  };

  const handleNavClick = (section: Section) => {
    if (section.onClick) {
      section.onClick();
    } else {
      scrollToSection(section.id);
    }
  };

  return (
    <div className="fixed bottom-2 md:bottom-5 right-2 md:right-8 z-50 flex flex-col items-end gap-3">
      {/* Navigation Dots */}
      <div className="flex flex-col items-center gap-3 bg-white rounded-full shadow-lg border border-gray-200 p-4">
        {sections.map((section, index) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => handleNavClick(section)}
              className="group relative flex items-center justify-center transition-all duration-300"
              aria-label={`Navigate to ${section.label || `section ${index + 1}`}`}
              title={section.label || `Section ${index + 1}`}
            >
              {/* Icon or Circle */}
              {section.icon ? (
                <span
                  className={`
                    flex items-center justify-center transition-all duration-300 cursor-pointer
                    ${
                      isActive
                        ? "text-primary scale-110"
                        : "text-gray-400 hover:text-gray-600 group-hover:scale-105"
                    }
                  `}
                >
                  {section.icon}
                </span>
              ) : (
                <span
                  className={`
                    block rounded-full transition-all duration-300 cursor-pointer
                    ${
                      isActive
                        ? "w-5 h-5 md:w-8 md:h-8 bg-primary"
                        : "w-2.5 h-2.5 md:w-4 md:h-4 bg-gray-300 hover:bg-gray-400 group-hover:w-3 group-hover:h-3"
                    }
                  `}
                />
              )}

              {/* Label on hover (optional) */}
              {section.label && (
                <span className="absolute right-8 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none">
                  {section.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Disclaimer Text */}
      {disclaimer && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 w-11/12 md:w-4/6">
          <small className="italic">{disclaimer}</small>
        </div>
      )}
    </div>
  );
};
