import { forwardRef } from "react";
import { useAuthorizedMediaSrc } from "@shared/lib/useAuthorizedMediaSrc";
import { cn } from "@shared/lib/cn";

const DEFAULT_FALLBACK = "/default-avatar.png";

/**
 * <img> that loads AuthZ-protected media via authorized fetch + blob URL.
 * Bare src= to /api/media/* would 401 because Bearer is memory-only.
 *
 * Pass fallback="" (or null) to skip avatar fallback — e.g. profile covers.
 */
export const AuthorizedMediaImg = forwardRef(function AuthorizedMediaImg(
  {
    src,
    fallback = DEFAULT_FALLBACK,
    alt = "",
    className,
    onError,
    ...imgProps
  },
  ref
) {
  const safeFallback = fallback || undefined;
  const resolved = useAuthorizedMediaSrc(src, {
    fallback: safeFallback ?? "",
  });
  const isLoading = Boolean(src) && resolved === undefined;
  const displaySrc = isLoading
    ? undefined
    : resolved || safeFallback || undefined;

  return (
    <img
      {...imgProps}
      ref={ref}
      alt={alt}
      src={displaySrc}
      className={cn(
        className,
        isLoading && "bg-muted",
        !displaySrc && !isLoading && "bg-muted"
      )}
      onError={(event) => {
        if (
          safeFallback &&
          !event.currentTarget.src.endsWith(safeFallback)
        ) {
          event.currentTarget.src = safeFallback;
        } else if (!safeFallback) {
          event.currentTarget.removeAttribute("src");
        }
        onError?.(event);
      }}
    />
  );
});

export default AuthorizedMediaImg;
