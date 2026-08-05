import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Menu, X } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// Pages to render on each side of the current viewport — smaller on mobile
// so post-zoom re-rasterization stays fast
const RENDER_BUFFER = typeof window !== 'undefined' && window.innerWidth < 768 ? 3 : 8;

const DOCUMENTS = [
  { id: 'rulebook',  label: 'Rulebook',          file: '/2026 Shadow Accord Rulebook.pdf' },
  { id: 'st',        label: 'ST Rulebook',        file: '/2025 Shadow Accord ST Rulebook v1.1.pdf', locked: true },
  { id: 'vampire',   label: 'Vampire Rituals',    file: '/Shadow Accord Vampire Blood Rituals List (2025).pdf' },
  { id: 'shifter',   label: 'Shifter Rituals',    file: '/Shadow Accord Shifter Glyph Rituals List (2025).pdf' },
  { id: 'sorcerer',  label: 'Sorcerer Rituals',   file: '/Shadow Accord Sorcerer Mystic Rituals List (2025).pdf' },
  { id: 'wraith',    label: 'Wraith Rituals',     file: '/Shadow Accord Wraith Arcanos Rituals List (2025).pdf' },
  { id: 'other',     label: 'Other Rituals',      file: '/Shadow Accord Other Rituals List (2025).pdf' },
];

// Session-only password for the ST Rulebook (not persisted)
const ST_PASSWORD = '1234!';

// Pre-resolve all outline item destinations to page numbers up front
const resolveOutlineItems = async (doc, items) => {
  if (!items?.length) return [];
  const resolved = await Promise.all(
    items.map(async (item) => {
      let pageNum = null;
      if (item.dest) {
        try {
          let dest = item.dest;
          if (typeof dest === 'string') dest = await doc.getDestination(dest);
          if (dest?.[0] != null) pageNum = (await doc.getPageIndex(dest[0])) + 1;
        } catch { /* ignore unresolvable destinations */ }
      }
      const children = await resolveOutlineItems(doc, item.items);
      return { title: item.title, pageNum, items: children };
    })
  );
  return resolved;
};

// Recursive TOC tree with depth-based visual hierarchy
const OutlineTree = ({ items, onNavigate, depth = 0 }) => {
  const [expanded, setExpanded] = useState({});

  if (!items?.length) return null;

  return (
    <ul className={depth > 0 ? 'border-l-2 border-gray-700 ml-3 pl-2 mt-0.5 mb-1' : ''}>
      {items.map((item, i) => {
        const isTopLevel  = depth === 0;
        const isSecond    = depth === 1;
        const hasChildren = item.items?.length > 0;
        const isExpanded  = expanded[i];

        return (
          <li key={i} className={isTopLevel ? 'border-b border-gray-700/50 last:border-0' : ''}>
            <div className={`flex items-start gap-1 group rounded hover:bg-gray-700/40 transition-colors ${
              isTopLevel ? 'py-2 px-1' : isSecond ? 'py-1 px-1' : 'py-0.5 px-1'
            }`}>
              <button
                onClick={() => hasChildren && setExpanded(e => ({ ...e, [i]: !e[i] }))}
                className={`flex-shrink-0 mt-0.5 transition-colors ${
                  hasChildren ? 'text-gray-500 hover:text-gray-300 cursor-pointer' : 'cursor-default opacity-0'
                }`}
                tabIndex={hasChildren ? 0 : -1}
              >
                {hasChildren
                  ? (isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)
                  : <span className="w-3 h-3 block" />
                }
              </button>
              <button
                onClick={() => item.pageNum && onNavigate(item.pageNum)}
                className={`text-left leading-snug break-words transition-colors hover:text-red-400 ${
                  isTopLevel
                    ? 'text-xs font-semibold text-gray-100'
                    : isSecond
                      ? 'text-xs text-gray-300'
                      : 'text-xs text-gray-500'
                }`}
              >
                {item.title}
              </button>
            </div>
            {hasChildren && isExpanded && (
              <OutlineTree items={item.items} onNavigate={onNavigate} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
};

// Main viewer
const RulesViewer = ({ onBack, themeClasses }) => {
  const [activeDocId, setActiveDocId]         = useState('rulebook');
  const [stUnlocked, setStUnlocked]           = useState(false);
  const [showLockModal, setShowLockModal]     = useState(false);
  const [lockInput, setLockInput]             = useState('');
  const [lockError, setLockError]             = useState(false);
  const [numPages, setNumPages]               = useState(null);
  const [pageInput, setPageInput]             = useState('1');
  // baseScale = scale the canvases are actually rasterized at (fit-to-width).
  // Changes rarely (load / resize / Fit), so rasterization is infrequent.
  const [baseScale, setBaseScale]             = useState(1.0);
  // zoom = live CSS `zoom` multiplier on top of baseScale. Scaling via CSS
  // never re-rasterizes the canvas, so zooming can't flash or jump.
  const [zoom, setZoom]                       = useState(1.0);
  const [pdfDoc, setPdfDoc]                   = useState(null);
  const [outline, setOutline]                 = useState([]);
  const [hasOutline, setHasOutline]           = useState(false);
  // Default sidebar closed on mobile (<768px), open on desktop
  const [sidebarOpen, setSidebarOpen]         = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [visiblePages, setVisiblePages]       = useState(new Set([1, 2, 3]));

  // Search state
  const [searchQuery, setSearchQuery]         = useState('');
  const [activeHighlight, setActiveHighlight] = useState('');
  const [searchResults, setSearchResults]     = useState([]);
  const [searchIdx, setSearchIdx]             = useState(0);
  const [isSearching, setIsSearching]         = useState(false);
  const [searchDone, setSearchDone]           = useState(false);
  const [loadProgress, setLoadProgress]       = useState(0);

  const pageRefs              = useRef({});
  const observerRef           = useRef(null);
  const scrollContainerRef    = useRef(null);
  const currentPageRef        = useRef(1);
  const zoomRef               = useRef(1.0);
  const prevZoomRef           = useRef(1.0);
  const pinchStartDistRef     = useRef(null);
  const pinchStartZoomRef     = useRef(null);
  const pinchingRef           = useRef(false);
  const fitScaleRef           = useRef(1.0); // baseScale at fit-to-width, for accurate % label
  const skipScrollAdjRef      = useRef(false); // prevent scroll jump when baking zoom into baseScale
  const currentDoc            = DOCUMENTS.find(d => d.id === activeDocId);

  // pdf.js options — disableAutoFetch makes it range-request only the pages you
  // actually view instead of downloading the whole (large) PDF up front, so the
  // first page appears far sooner. Memoized so <Document> doesn't reload.
  const pdfOptions = useMemo(() => ({
    disableAutoFetch: true,
    disableStream: false,
  }), []);

  // Set up IntersectionObserver for lazy page rendering
  useEffect(() => {
    if (!numPages) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Ignore observer noise while pinching: page geometry is moving
        if (pinchingRef.current) return;
        // Collect all intersecting page numbers from this batch
        const intersecting = entries
          .filter(e => e.isIntersecting)
          .map(e => parseInt(e.target.dataset.page, 10))
          .filter(n => !isNaN(n));
        if (!intersecting.length) return;
        // Use the median page in the batch as the anchor (handles fast scrolling:
        // intermediate pages batch together; final position becomes the anchor)
        intersecting.sort((a, b) => a - b);
        const anchor = intersecting[Math.floor(intersecting.length / 2)];
        currentPageRef.current = anchor;
        // Replace (not accumulate) with a window around the anchor so:
        // 1. Zoom only re-renders current window, not every visited page
        // 2. Fast scroll evicts intermediate pages; destination renders first
        setVisiblePages(() => {
          const next = new Set();
          for (let p = Math.max(1, anchor - RENDER_BUFFER); p <= Math.min(numPages, anchor + RENDER_BUFFER); p++) {
            next.add(p);
          }
          return next;
        });
      },
      { rootMargin: '200px', threshold: 0 }
    );

    Object.values(pageRefs.current).forEach(el => {
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [numPages]);

  // Fit PDF width to the scroll container — sets the rasterization scale and
  // defaults zoom by orientation: 0.5 landscape (wide screens), 1.0 portrait.
  const fitWidth = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const available = container.clientWidth - 32; // 16px padding each side
    const newScale = parseFloat(Math.max(0.4, Math.min(3.0, available / 612)).toFixed(2));
    fitScaleRef.current = newScale;
    setBaseScale(newScale);
    setZoom(window.innerWidth > window.innerHeight ? 0.5 : 1.0);
  }, []);

  // Auto-fit on document load and re-fit on window resize
  useEffect(() => {
    if (!numPages) return;
    fitWidth();
    window.addEventListener('resize', fitWidth);
    return () => window.removeEventListener('resize', fitWidth);
  }, [numPages, fitWidth]);

  // Keep zoomRef current so touch handlers (added once) can read latest value
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // When zoom changes, the CSS `zoom` grows/shrinks the scroll height. Adjust
  // scrollTop around the viewport center so it stays on the same content.
  // No rasterization happens here, so this can't flash.
  useLayoutEffect(() => {
    const prev = prevZoomRef.current;
    prevZoomRef.current = zoom;
    if (prev === zoom) return;
    // Skip when baking zoom into baseScale — visual size unchanged, scroll is already correct
    if (skipScrollAdjRef.current) { skipScrollAdjRef.current = false; return; }
    const el = scrollContainerRef.current;
    if (!el) return;
    const ratio  = zoom / prev;
    const center = el.scrollTop + el.clientHeight / 2;
    el.scrollTop = Math.max(0, center * ratio - el.clientHeight / 2);
  }, [zoom]);

  // Re-rasterize at full quality after zoom settles above 1.0 (CSS upscaling blurs canvas)
  useEffect(() => {
    if (zoom <= 1.0) return;
    const id = setTimeout(() => {
      skipScrollAdjRef.current = true;
      setBaseScale(bs => parseFloat(Math.max(0.4, Math.min(3.0, bs * zoom)).toFixed(2)));
      setZoom(1.0);
    }, 400);
    return () => clearTimeout(id);
  }, [zoom]);

  const changeZoom = useCallback((delta) => {
    setZoom(z => Math.max(0.5, Math.min(4.0, parseFloat((z + delta).toFixed(2)))));
  }, []);

  // Pinch-to-zoom — non-passive touchmove so we can preventDefault and stop the
  // browser's native zoom. Adjusts the CSS `zoom` multiplier (no rasterization).
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const dist = (t) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const onStart = (e) => {
      if (e.touches.length === 2) {
        pinchStartDistRef.current = dist(e.touches);
        pinchStartZoomRef.current = zoomRef.current;
        pinchingRef.current = true;
      }
    };
    const onMove = (e) => {
      if (e.touches.length !== 2 || pinchStartDistRef.current === null) return;
      e.preventDefault();
      const ratio = dist(e.touches) / pinchStartDistRef.current;
      setZoom(Math.max(0.5, Math.min(4.0,
        parseFloat((pinchStartZoomRef.current * ratio).toFixed(2))
      )));
    };
    const onEnd = (e) => {
      if (e.touches.length < 2) {
        pinchStartDistRef.current = null;
        pinchingRef.current = false;
      }
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: true });
    el.addEventListener('touchcancel', onEnd,  { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, []);  // runs once — zoom accessed via ref, setZoom is stable

  // Switch document
  const switchDoc = useCallback((docId) => {
    setActiveDocId(docId);
    setNumPages(null);
    setPageInput('1');
    setPdfDoc(null);
    setOutline([]);
    setHasOutline(false);
    setSearchQuery('');
    setActiveHighlight('');
    setSearchResults([]);
    setSearchIdx(0);
    setSearchDone(false);
    setVisiblePages(new Set([1, 2, 3]));
    pageRefs.current = {};
    currentPageRef.current = 1;
    setLoadProgress(0);
  }, []);

  // Document load - also pre-resolves all outline destinations in parallel
  const onLoadSuccess = useCallback(async (doc) => {
    setPdfDoc(doc);
    setNumPages(doc.numPages);
    setPageInput('1');
    setLoadProgress(100);
    try {
      const rawOutline = await doc.getOutline();
      if (rawOutline?.length) {
        const resolved = await resolveOutlineItems(doc, rawOutline);
        setOutline(resolved);
        setHasOutline(true);
      } else {
        setOutline([]);
        setHasOutline(false);
      }
    } catch {
      setOutline([]);
      setHasOutline(false);
    }
  }, []);

  // Scroll to page - instant jump, and pre-adds the target to visiblePages so
  // rendering starts immediately rather than waiting for IntersectionObserver.
  // Using 'auto' (not 'smooth') avoids triggering the observer for every page
  // between current position and target, which caused cascading render queues.
  const scrollToPage = useCallback((pageNum) => {
    currentPageRef.current = pageNum;
    setVisiblePages(() => {
      const next = new Set();
      for (let p = Math.max(1, pageNum - RENDER_BUFFER); p <= Math.min(numPages || 9999, pageNum + RENDER_BUFFER); p++) {
        next.add(p);
      }
      return next;
    });
    pageRefs.current[pageNum]?.scrollIntoView({ behavior: 'auto', block: 'start' });
    setPageInput(String(pageNum));
  }, [numPages]);

  // Outline click - pageNum already resolved, instant response
  // Closes TOC drawer on mobile after navigating
  const handleOutlineClick = useCallback((pageNum) => {
    scrollToPage(pageNum);
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false);
  }, [scrollToPage]);

  // Jump to page from input
  const jumpToPage = useCallback(() => {
    const val = parseInt(pageInput, 10);
    if (!isNaN(val) && val >= 1 && val <= (numPages || 1)) scrollToPage(val);
    else setPageInput('1');
  }, [pageInput, numPages, scrollToPage]);

  // Search through all pages
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim() || !pdfDoc) return;
    setIsSearching(true);
    setSearchDone(false);
    setSearchResults([]);
    setSearchIdx(0);
    setActiveHighlight('');

    const results = [];
    const query = searchQuery.toLowerCase();
    try {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const tc   = await page.getTextContent();
        const text = tc.items.map(it => it.str ?? '').join(' ').toLowerCase();
        if (text.includes(query)) results.push(i);
      }
    } catch (err) {
      console.error('PDF search error:', err);
    }

    setSearchResults(results);
    setSearchIdx(0);
    setSearchDone(true);
    setIsSearching(false);
    setActiveHighlight(searchQuery.trim());

    if (results.length > 0) {
      setVisiblePages(prev => {
        const next = new Set(prev);
        results.slice(0, 5).forEach(p => {
          for (let i = Math.max(1, p - 1); i <= Math.min(pdfDoc.numPages, p + 1); i++) next.add(i);
        });
        return next;
      });
      setTimeout(() => scrollToPage(results[0]), 100);
    }
  }, [searchQuery, pdfDoc, scrollToPage]);

  const navigateResult = useCallback((delta) => {
    if (!searchResults.length) return;
    const next = (searchIdx + delta + searchResults.length) % searchResults.length;
    setSearchIdx(next);
    setTimeout(() => scrollToPage(searchResults[next]), 50);
  }, [searchIdx, searchResults, scrollToPage]);

  // Apply highlights directly to text layer spans after they render.
  // DOM background-color on whole spans avoids the character-offset error that
  // customTextRenderer inline marks suffer from (pdfjs scaleX stretches the run
  // as a whole but character widths inside don't match PDF metrics).
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const query = activeHighlight?.toLowerCase() || '';
    const apply = () => {
      container.querySelectorAll('.textLayer span').forEach(span => {
        span.style.backgroundColor = query && span.textContent.toLowerCase().includes(query)
          ? 'rgba(250,204,21,0.45)' : '';
      });
    };
    apply();
    const id = setTimeout(apply, 200); // retry for async-rendered text layers
    return () => clearTimeout(id);
  }, [activeHighlight, visiblePages]);

  // Internal PDF hyperlink navigation (annotation layer + outline clicks)
  const handleItemClick = useCallback(({ pageNumber }) => {
    if (pageNumber) scrollToPage(pageNumber);
  }, [scrollToPage]);

  return (
    <div className={`${themeClasses.base} flex flex-col`} style={{ height: '100vh' }}>

      {/* ST Rulebook lock modal */}
      {showLockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-80 shadow-xl">
            <h2 className="text-white font-bold text-lg mb-1">ST Rulebook</h2>
            <p className="text-gray-400 text-sm mb-4">This document is restricted. Enter the ST password to unlock for this session.</p>
            <input
              type="password"
              autoFocus
              placeholder="Password"
              value={lockInput}
              onChange={e => { setLockInput(e.target.value); setLockError(false); }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (lockInput === ST_PASSWORD) { setStUnlocked(true); setShowLockModal(false); switchDoc('st'); }
                  else setLockError(true);
                }
                if (e.key === 'Escape') setShowLockModal(false);
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {lockError && <p className="text-red-400 text-xs mb-2">Incorrect password.</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowLockModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button
                onClick={() => {
                  if (lockInput === ST_PASSWORD) { setStUnlocked(true); setShowLockModal(false); switchDoc('st'); }
                  else setLockError(true);
                }}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded">
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-700 flex-shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm mr-2">Back</button>
        <h1 className="text-lg font-bold text-red-400 mr-auto">Rules &amp; Rituals</h1>
      </div>

      {/* Document tab bar */}
      <div className="flex gap-1 px-3 py-2 border-b border-gray-700 overflow-x-auto flex-shrink-0">
        {DOCUMENTS.map(doc => {
          const isLocked = doc.locked && !stUnlocked;
          return (
            <button key={doc.id}
              onClick={() => {
                if (isLocked) { setLockInput(''); setLockError(false); setShowLockModal(true); }
                else switchDoc(doc.id);
              }}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeDocId === doc.id ? 'bg-red-700 text-white'
                : isLocked ? 'bg-gray-800 text-gray-500 cursor-pointer'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}>
              {isLocked && <span>🔒</span>}
              {doc.label}
            </button>
          );
        })}
      </div>

      {/* Controls - two rows for mobile friendliness */}
      <div className="px-3 py-2 border-b border-gray-700 flex-shrink-0 space-y-2">

        {/* Row 1: TOC toggle + search */}
        <div className="flex items-center gap-2">
          {hasOutline && (
            <button onClick={() => setSidebarOpen(o => !o)}
              className={`flex items-center gap-1 px-3 py-2 rounded text-xs transition-colors flex-shrink-0 ${
                sidebarOpen ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}>
              <Menu className="w-4 h-4" />
            </button>
          )}
          <input
            type="text"
            placeholder="Search and highlight..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchDone(false); }}
            onKeyDown={e => e.key === 'Enter' && performSearch()}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white flex-1 min-w-0"
          />
          <button onClick={performSearch} disabled={isSearching || !pdfDoc}
            className="px-3 py-2 bg-blue-700 text-white rounded text-sm disabled:opacity-40 whitespace-nowrap flex-shrink-0">
            {isSearching ? '...' : 'Find'}
          </button>
          {searchDone && searchResults.length === 0 && (
            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">None</span>
          )}
          {searchResults.length > 0 && (
            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
              {searchIdx + 1}/{searchResults.length}
            </span>
          )}
          {searchResults.length > 1 && <>
            <button onClick={() => navigateResult(-1)} className="px-2 py-2 text-gray-300 hover:text-white text-sm flex-shrink-0 bg-gray-700 rounded">Prev</button>
            <button onClick={() => navigateResult(1)}  className="px-2 py-2 text-gray-300 hover:text-white text-sm flex-shrink-0 bg-gray-700 rounded">Next</button>
          </>}
          {activeHighlight && (
            <button onClick={() => { setActiveHighlight(''); setSearchResults([]); setSearchDone(false); }}
              className="flex-shrink-0 text-gray-500 hover:text-white p-2" title="Clear highlights">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row 2: Page jump + zoom */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-gray-500 text-xs">p.</span>
            <input
              type="number"
              min={1}
              max={numPages || 1}
              value={pageInput}
              onChange={e => setPageInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && jumpToPage()}
              className="w-14 bg-gray-700 border border-gray-600 rounded px-1 py-2 text-center text-white text-sm"
            />
            <button onClick={jumpToPage} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-xs text-gray-300">Go</button>
            <span className="text-gray-500 text-xs">/ {numPages ?? '?'}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => changeZoom(-0.1)}
              className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 font-bold text-sm">-</button>
            <span className="text-gray-300 text-xs w-12 text-center">{Math.round(baseScale * zoom / fitScaleRef.current * 100)}%</span>
            <button onClick={() => changeZoom(0.1)}
              className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 font-bold text-sm">+</button>
            <button onClick={fitWidth}
              className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-xs text-gray-300">Fit</button>
          </div>
        </div>
      </div>

      {/* Body: sidebar + scrollable PDF */}
      <div className="flex flex-1 min-h-0">

        {/* TOC - fixed drawer on mobile, sidebar on md+ */}
        {hasOutline && sidebarOpen && (
          <>
            {/* Mobile backdrop */}
            <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            <div className={`
              fixed inset-y-0 left-0 w-4/5 max-w-xs z-50 border-r border-gray-700 overflow-y-auto bg-gray-900
              md:relative md:inset-auto md:w-64 md:z-auto md:flex-shrink-0 md:bg-gray-900/50
            `}>
              <div className="p-3">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contents</p>
                  <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <OutlineTree items={outline} onNavigate={handleOutlineClick} />
              </div>
            </div>
          </>
        )}

        {/* Continuous scroll PDF area — touch-action allows panning but disables
            the browser's native pinch zoom (we handle pinch ourselves) */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-gray-900" style={{ touchAction: 'pan-x pan-y' }}>
          <Document
            file={currentDoc.file}
            options={pdfOptions}
            onLoadSuccess={onLoadSuccess}
            onLoadProgress={({ loaded, total }) => {
              if (total) setLoadProgress(Math.min(99, Math.round((loaded / total) * 100)));
            }}
            onItemClick={handleItemClick}
            loading={
              <div className="text-gray-400 mt-20 text-center">
                <div className="text-lg mb-2">Loading PDF...</div>
                <div className="w-48 h-2 mx-auto bg-gray-700 rounded overflow-hidden">
                  <div className="h-full bg-red-600 transition-all" style={{ width: `${loadProgress}%` }} />
                </div>
                <div className="text-xs mt-1">{loadProgress}%</div>
              </div>
            }
            error={
              <div className="text-red-400 mt-20 text-center">
                <div>Failed to load PDF. Make sure the file is in the public folder.</div>
              </div>
            }
          >
            {/* Live zoom via CSS `zoom` — scales both canvas bitmap and layout
                without re-rasterizing, so zooming never flashes or jumps.
                Pages rasterize only at baseScale (fit width), changed rarely. */}
            <div style={zoom !== 1 ? { zoom } : undefined}>
              {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
                <div
                  key={pageNum}
                  data-page={pageNum}
                  ref={el => {
                    pageRefs.current[pageNum] = el;
                    if (el && observerRef.current) observerRef.current.observe(el);
                  }}
                  className="flex justify-center py-3 border-b border-gray-800/60"
                >
                  {visiblePages.has(pageNum) ? (
                    <Page
                      pageNumber={pageNum}
                      scale={baseScale}
                      renderTextLayer
                      renderAnnotationLayer
                      className="shadow-2xl"
                      loading={
                        <div
                          style={{ width: Math.round(612 * baseScale), height: Math.round(792 * baseScale) }}
                          className="bg-gray-800 rounded select-none"
                        />
                      }
                    />
                  ) : (
                    <div
                      style={{ width: Math.round(612 * baseScale), height: Math.round(792 * baseScale) }}
                      className="bg-gray-800 rounded flex items-center justify-center text-gray-600 text-sm select-none"
                    >
                      {pageNum}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
};

export default RulesViewer;
