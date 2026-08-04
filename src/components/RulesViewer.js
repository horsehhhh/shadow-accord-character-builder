import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Menu, X } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const RENDER_BUFFER = 8; // pages to render on each side of the current viewport

const DOCUMENTS = [
  { id: 'rulebook',  label: 'Rulebook',          file: '/2026 Shadow Accord Rulebook.pdf' },
  { id: 'vampire',   label: 'Vampire Rituals',    file: '/Shadow Accord Vampire Blood Rituals List (2025).pdf' },
  { id: 'shifter',   label: 'Shifter Rituals',    file: '/Shadow Accord Shifter Glyph Rituals List (2025).pdf' },
  { id: 'sorcerer',  label: 'Sorcerer Rituals',   file: '/Shadow Accord Sorcerer Mystic Rituals List (2025).pdf' },
  { id: 'wraith',    label: 'Wraith Rituals',     file: '/Shadow Accord Wraith Arcanos Rituals List (2025).pdf' },
  { id: 'other',     label: 'Other Rituals',      file: '/Shadow Accord Other Rituals List (2025).pdf' },
];

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
  const [numPages, setNumPages]               = useState(null);
  const [pageInput, setPageInput]             = useState('1');
  const [scale, setScale]                     = useState(1.0);
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

  const pageRefs              = useRef({});
  const observerRef           = useRef(null);
  const scrollContainerRef    = useRef(null);
  const currentPageRef        = useRef(1);
  const scaleRef              = useRef(1.0);
  const pinchStartDistRef     = useRef(null);
  const pinchStartScaleRef    = useRef(null);
  const currentDoc            = DOCUMENTS.find(d => d.id === activeDocId);

  // Set up IntersectionObserver for lazy page rendering
  useEffect(() => {
    if (!numPages) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
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

  // Fit PDF width to the scroll container — called on load and window resize
  const fitWidth = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const available = container.clientWidth - 32; // 16px padding each side
    setScale(parseFloat(Math.max(0.4, Math.min(3.0, available / 612)).toFixed(2)));
  }, []);

  // Auto-fit on document load and re-fit on window resize
  useEffect(() => {
    if (!numPages) return;
    fitWidth();
    window.addEventListener('resize', fitWidth);
    return () => window.removeEventListener('resize', fitWidth);
  }, [numPages, fitWidth]);

  // Keep scaleRef current so touch handlers (added once via [] dep) can read it
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // Pinch-to-zoom — must use non-passive touchmove to call preventDefault,
  // preventing the browser's native page zoom from fighting our handler
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
        pinchStartDistRef.current  = dist(e.touches);
        pinchStartScaleRef.current = scaleRef.current;
      }
    };
    const onMove = (e) => {
      if (e.touches.length !== 2 || pinchStartDistRef.current === null) return;
      e.preventDefault();
      const ratio    = dist(e.touches) / pinchStartDistRef.current;
      const newScale = Math.max(0.4, Math.min(3.0,
        parseFloat((pinchStartScaleRef.current * ratio).toFixed(2))
      ));
      setScale(newScale);
    };
    const onEnd = () => { pinchStartDistRef.current = null; };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, []);  // runs once — scale accessed via ref, setScale is stable

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
  }, []);

  // Document load - also pre-resolves all outline destinations in parallel
  const onLoadSuccess = useCallback(async (doc) => {
    setPdfDoc(doc);
    setNumPages(doc.numPages);
    setPageInput('1');
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

  // Search term highlight renderer for PDF text layer
  const customTextRenderer = useCallback(({ str }) => {
    if (!activeHighlight || !str) return str;
    const query    = activeHighlight.toLowerCase();
    const lowerStr = str.toLowerCase();
    if (!lowerStr.includes(query)) return str;

    const parts = [];
    let lastIdx = 0;
    let idx = lowerStr.indexOf(query, 0);
    while (idx !== -1) {
      if (idx > lastIdx) parts.push(str.slice(lastIdx, idx));
      parts.push(
        <mark
          key={idx}
          style={{ backgroundColor: '#fbbf24', color: '#111', borderRadius: '2px', padding: '0 1px' }}
        >
          {str.slice(idx, idx + query.length)}
        </mark>
      );
      lastIdx = idx + query.length;
      idx = lowerStr.indexOf(query, lastIdx);
    }
    if (lastIdx < str.length) parts.push(str.slice(lastIdx));
    return parts;
  }, [activeHighlight]);

  // Internal PDF hyperlink navigation (annotation layer + outline clicks)
  const handleItemClick = useCallback(({ pageNumber }) => {
    if (pageNumber) scrollToPage(pageNumber);
  }, [scrollToPage]);

  return (
    <div className={`${themeClasses.base} flex flex-col`} style={{ height: '100vh' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-700 flex-shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm mr-2">Back</button>
        <h1 className="text-lg font-bold text-red-400 mr-auto">Rules &amp; Rituals</h1>
      </div>

      {/* Document tab bar */}
      <div className="flex gap-1 px-3 py-2 border-b border-gray-700 overflow-x-auto flex-shrink-0">
        {DOCUMENTS.map(doc => (
          <button key={doc.id} onClick={() => switchDoc(doc.id)}
            className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors ${
              activeDocId === doc.id ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}>
            {doc.label}
          </button>
        ))}
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
            <button onClick={() => setScale(s => Math.max(0.4, parseFloat((s - 0.15).toFixed(2))))}
              className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 font-bold text-sm">-</button>
            <span className="text-gray-300 text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3.0, parseFloat((s + 0.15).toFixed(2))))}
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

        {/* Continuous scroll PDF area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-gray-900">
          <Document
            file={currentDoc.file}
            onLoadSuccess={onLoadSuccess}
            onItemClick={handleItemClick}
            loading={
              <div className="text-gray-400 mt-20 text-center">
                <div className="text-lg mb-2">Loading PDF...</div>
              </div>
            }
            error={
              <div className="text-red-400 mt-20 text-center">
                <div>Failed to load PDF. Make sure the file is in the public folder.</div>
              </div>
            }
          >
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
                    scale={scale}
                    renderTextLayer
                    renderAnnotationLayer
                    customTextRenderer={activeHighlight ? customTextRenderer : undefined}
                    className="shadow-2xl"
                  />
                ) : (
                  <div
                    style={{ width: Math.round(612 * scale), height: Math.round(792 * scale) }}
                    className="bg-gray-800 rounded flex items-center justify-center text-gray-600 text-sm select-none"
                  >
                    {pageNum}
                  </div>
                )}
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
};

export default RulesViewer;
