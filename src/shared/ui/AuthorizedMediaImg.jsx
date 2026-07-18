import { forwardRef } from "react";
import { useAuthorizedMediaSrc } from "@shared/lib/useAuthorizedMediaSrc";
import { cn } from "@shared/lib/cn";

const DEFAULT_FALLBACK = "/default-avatar.png";

/**
 * <img> that loads AuthZ-protected media via authorized fetch + blob URL.
 * Bare src= to /api/media/* would 401 because Bearer is memory-only.
 */
export const AuthorizedMediaImg = forwardRef(function AuthorizedMediaImg(
  { src, fallback = DEFAULT_FALLBACK, alt = "", className, onError, ...imgProps },
  ref
) {
  const resolved = useAuthorizedMediaSrc(src, { fallback });
  const isLoading = Boolean(src) && resolved === undefined;
  const displaySrc = isLoading ? undefined : resolved || fallback;

  return (
    <img
      {...imgProps}
      ref={ref}
      alt={alt}
      src={displaySrc}
      className={cn(className, isLoading && "bg-muted")}
      onError={(event) => {
        if (!event.currentTarget.src.endsWith(fallback)) {
          event.currentTarget.src = fallback;
        }
        onError?.(event);
      }}
    />
  );
});

export default AuthorizedMediaImg;
