"use client";
/** Scroll without replacing the public snapshot stored in the URL fragment. */
export function JumpLink({
  target,
  className,
  children,
}: {
  target: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`#${target}`}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        const element = document.getElementById(target);
        if (!element) return;
        if (!element.hasAttribute("tabindex")) element.tabIndex = -1;
        element.focus({ preventScroll: true });
        element.scrollIntoView({
          block: "start",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
      }}
    >
      {children}
    </a>
  );
}
