export const SIDEBAR_KEY = "life-trail-sidebar";
const CHANGE_EVENT = "life-trail-sidebar-change";

/* The collapsed state lives on <html data-sidebar>, so CSS can use it before React loads. */
export function isCollapsed(): boolean {
  return document.documentElement.dataset.sidebar === "collapsed";
}

export function setCollapsed(collapsed: boolean) {
  if (collapsed) document.documentElement.dataset.sidebar = "collapsed";
  else delete document.documentElement.dataset.sidebar;
  try {
    if (collapsed) localStorage.setItem(SIDEBAR_KEY, "collapsed");
    else localStorage.removeItem(SIDEBAR_KEY);
  } catch {
    /* Storage blocked: the choice still applies until the page is closed. */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeSidebar(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

/* Runs before first paint so the sidebar never jumps from open to closed on load. */
export const SIDEBAR_INIT_SCRIPT = `(function(){try{if(localStorage.getItem("${SIDEBAR_KEY}")==="collapsed")document.documentElement.dataset.sidebar="collapsed"}catch(e){}})()`;
