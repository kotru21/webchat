import { forwardRef } from "react";
import { useAuthorizedMediaSrc } from "@shared/lib/useAuthorizedMediaSrc";

const DEFAULT_FALLBACK = "/default-avatar.png";

/**
 * <img> that loads AuthZ-protected media via authorized fetch + blob URL.
 * Bare src= to /api/media/* would 401 because Bearer is memory-only.
 */
export const AuthorizedMediaImg = forwardRef(function AuthorizedMediaImg(
  { src, fallback = DEFAULT_FALLBACK, alt = "", onError, ...imgProps },
  ref
) {
  const resolved = useAuthorizedMediaSrc(src, { fallback });

  return (
    <img
      {...imgProps}
      ref={ref}
      alt={alt}
      src={resolved || fallback}
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
