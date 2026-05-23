import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { devLog } from "../utils/devLog";

/**
 * ScrollToTop component that resets scroll position and clears body styles on route change.
 * This helps fix issues where a modal or backdrop leaves the page unscrollable or dark.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);

    // Reset body styles that might have been set by a modal
    document.body.style.overflow = "unset";
    document.body.style.paddingRight = "0px";
    
    // Clear any lingering backdrop classes
    document.querySelectorAll('.modal-backdrop, .bg-black\\/60, .backdrop-blur').forEach(el => el.remove());
    
    devLog(`Route changed to ${pathname}, resetting scroll and body styles.`);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
