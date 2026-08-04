import React, { useState, useCallback, useRef } from 'react';
import { Document, Outline, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker source from local file (works offline, Electron, Capacitor)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const DOCUMENTS = [
  { id: 'rulebook',  label: 'Rulebook',          file: '/2026 Shadow Accord Rulebook.pdf' },
  { id: 'vampire',   label: 'Vampire Rituals',    file: '/Shadow Accord Vampire Blood Rituals List (2025).pdf' },
  { id: 'shifter',   label: 'Shifter Rituals',    file: '/Shadow Accord Shifter Glyph Rituals List (2025).pdf' },
  { id: 'sorcerer',  label: 'Sorcerer Rituals',   file: '/Shadow Accord Sorcerer Mystic Rituals List (2025).pdf' },
  { id: 'wraith',    label: 'Wraith Rituals',     file: '/Shadow Accord Wraith Arcanos Rituals List (2025).pdf' },
  { id: 'other',     label: 'Other Rituals',      file: '/Shadow Accord Other Rituals List (2025).pdf' },
];

// ─── Recursive outline tree ───────────────────────────────────────────────────
const OutlineTree = ({ items, onNavigate, depth = 0 }) => {
  const [expanded, setExpanded] = useState({});

  if (!items || items.length === 0) return null;

  return (
    <ul className={depth > 0 ? 'ml-3' : ''}>
      {items.map((item, i) => (
        <li key={i} className="my-0.5">
          <div className="flex items-start gap-1">
            {item.items?.length > 0 ? (
              <button
                onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
                className="text-gray-500 hover:text-white text-xs w-3 flex-shrink-0 mt-0.5"
              >
                {expanded[i] ? '▾' : '▸'}
              </button>
            ) : (
              <span className="w-3 flex-shrink-0" />
            )}
            <button
              onClick={() => onNavigate(item)}
              className="text-left text-xs text-gray-300 hover:text-red-400 leading-tight py-0.5 break-words"
            >
              {item.title}
            </button>
          </div>
          {item.items?.length > 0 && expanded[i] && (
            <OutlineTree items={item.items} onNavigate={onNavigate} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
};

// ─── Main viewer ─────────────────────────────────────────────────────────────
const RulesViewer = ({ onBack, themeClasses }) => {
  const [activeDocId, setActiveDocId]     = useState('rulebook');
  const [numPages, setNumPages]           = useState(null);
  const [pageNumber, setPageNumber]       = useState(1);
  const [pageInput, setPageInput]         = useState('1');
  const [scale, setScale]                 = useState(1.0);
  const [pdfDoc, setPdfDoc]               = useState(null);
  const [hasOutline, setHasOutline]       = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);

  // Search state
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);   // array of page numbers
  const [searchIdx, setSearchIdx]         = useState(0);
  const [isSearching, setIsSearching]     = useState(false);
  const [searchDone, setSearchDone]       = useState(false);

  const pageContainerRef = useRef(null);

  const currentDoc = DOCUMENTS.find(d => d.id === activeDocId);

  // ── Switch document ────────────────────────────────────────────────────────
  const switchDoc = useCallback((docId) => {
    setActiveDocId(docId);
    setNumPages(null);
    setPageNumber(1);
    setPageInput('1');
    setPdfDoc(null);
    setHasOutline(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchIdx(0);
    setSearchDone(false);
  }, []);

  // ── Document loaded ────────────────────────────────────────────────────────
  const onLoadSuccess = useCallback(async (doc) => {
    setPdfDoc(doc);
    setNumPages(doc.numPages);
    setPageNumber(1);
    setPageInput('1');

    // Check if outline exists
    try {
      const outline = await doc.getOutline();
      setHasOutline(!!(outline && outline.length > 0));
    } catch {
      setHasOutline(false);
    }
  }, []);

  // ── Navigate to outline item ───────────────────────────────────────────────
  const handleOutlineItemClick = useCallback(async ({ pageNumber: pNum }) => {
    if (pNum) {
      setPageNumber(pNum);
      setPageInput(String(pNum));
    }
  }, []);

  // ── Page input change ──────────────────────────────────────────────────────
  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputCommit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      const val = parseInt(pageInput, 10);
      if (!isNaN(val) && val >= 1 && val <= (numPages || 1)) {
        setPageNumber(val);
      } else {
        setPageInput(String(pageNumber));
      }
    }
  };

  const goToPage = (delta) => {
    const next = Math.max(1, Math.min(numPages || 1, pageNumber + delta));
    setPageNumber(next);
    setPageInput(String(next));
  };

  // ── Search ─────────────────────────────────────────────────────────────────
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim() || !pdfDoc) return;
    setIsSearching(true);
    setSearchDone(false);
    setSearchResults([]);
    setSearchIdx(0);

    const results = [];
    const query = searchQuery.toLowerCase();
    try {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str ?? '').join(' ').toLowerCase();
        if (text.includes(query)) results.push(i);
      }
    } catch (err) {
      console.error('PDF search error:', err);
    }

    setSearchResults(results);
    setSearchIdx(0);
    setSearchDone(true);
    setIsSearching(false);

    if (results.length > 0) {
      setPageNumber(results[0]);
      setPageInput(String(results[0]));
    }
  }, [searchQuery, pdfDoc]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') performSearch();
  };

  const navigateSearchResult = (delta) => {
    if (searchResults.length === 0) return;
    const next = (searchIdx + delta + searchResults.length) % searchResults.length;
    setSearchIdx(next);
    setPageNumber(searchResults[next]);
    setPageInput(String(searchResults[next]));
  };

  // ── Android check ──────────────────────────────────────────────────────────
  const isAndroid =
    typeof window !== 'undefined' &&
    window.Capacitor?.getPlatform?.() === 'android';

  // ── Android fallback ───────────────────────────────────────────────────────
  if (isAndroid) {
    return (
      <div className={`min-h-screen ${themeClasses.base}`}>
        <div className="max-w-lg mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Rules &amp; Rituals</h1>
          <p className="text-gray-400 text-sm mb-6">Tap a document to open it in your PDF viewer.</p>
          <div className="space-y-3">
            {DOCUMENTS.map(doc => (
              <a
                key={doc.id}
                href={doc.file}
                target="_blank"
                rel="noopener noreferrer"
                className={`${themeClasses.card} p-4 flex items-center justify-between hover:shadow-lg transition-all`}
              >
                <span className="font-medium">{doc.label}</span>
                <span className="text-gray-400 text-sm">Open →</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Full viewer ────────────────────────────────────────────────────────────
  return (
    <div className={`${themeClasses.base} flex flex-col`} style={{ height: '100vh' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-700 flex-shrink-0">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mr-2"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold text-red-400 mr-auto">Rules &amp; Rituals</h1>
      </div>

      {/* Document tab bar */}
      <div className="flex gap-1 px-3 py-2 border-b border-gray-700 overflow-x-auto flex-shrink-0">
        {DOCUMENTS.map(doc => (
          <button
            key={doc.id}
            onClick={() => switchDoc(doc.id)}
            className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors ${
              activeDocId === doc.id
                ? 'bg-red-700 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {doc.label}
          </button>
        ))}
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700 flex-shrink-0 flex-wrap">

        {/* TOC toggle */}
        {hasOutline && (
          <button
            onClick={() => setSidebarOpen(o => !o)}
            title="Toggle table of contents"
            className={`px-2 py-1 rounded text-xs transition-colors ${
              sidebarOpen ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ☰ TOC
          </button>
        )}

        {/* Search */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search pages…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchDone(false); }}
            onKeyDown={handleSearchKeyDown}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white flex-1 min-w-0"
          />
          <button
            onClick={performSearch}
            disabled={isSearching || !pdfDoc}
            className="px-2 py-1 bg-blue-700 text-white rounded text-sm disabled:opacity-40 whitespace-nowrap"
          >
            {isSearching ? '…' : 'Find'}
          </button>
          {searchDone && (
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {searchResults.length === 0 ? 'No results' : `${searchIdx + 1}/${searchResults.length}`}
            </span>
          )}
          {searchResults.length > 1 && (
            <>
              <button onClick={() => navigateSearchResult(-1)} className="px-1 py-1 text-gray-300 hover:text-white text-sm">‹</button>
              <button onClick={() => navigateSearchResult(1)}  className="px-1 py-1 text-gray-300 hover:text-white text-sm">›</button>
            </>
          )}
        </div>

        {/* Page nav */}
        <div className="flex items-center gap-1 text-sm flex-shrink-0">
          <button
            onClick={() => goToPage(-1)}
            disabled={pageNumber <= 1}
            className="px-2 py-1 bg-gray-700 rounded disabled:opacity-40 hover:bg-gray-600"
          >‹</button>
          <input
            type="number"
            min={1}
            max={numPages || 1}
            value={pageInput}
            onChange={handlePageInputChange}
            onKeyDown={handlePageInputCommit}
            onBlur={handlePageInputCommit}
            className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-1 text-center text-white text-sm"
          />
          <span className="text-gray-400 text-xs">/ {numPages ?? '?'}</span>
          <button
            onClick={() => goToPage(1)}
            disabled={pageNumber >= (numPages || 1)}
            className="px-2 py-1 bg-gray-700 rounded disabled:opacity-40 hover:bg-gray-600"
          >›</button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 text-sm flex-shrink-0">
          <button onClick={() => setScale(s => Math.max(0.4, parseFloat((s - 0.15).toFixed(2))))} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">−</button>
          <span className="text-gray-300 text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3.0, parseFloat((s + 0.15).toFixed(2))))} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">+</button>
          <button onClick={() => setScale(1.0)} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs">Reset</button>
        </div>
      </div>

      {/* Body: sidebar + PDF */}
      <div className="flex flex-1 min-h-0">

        {/* TOC Sidebar */}
        {hasOutline && sidebarOpen && (
          <div className="w-56 flex-shrink-0 border-r border-gray-700 overflow-y-auto bg-gray-850">
            <div className="p-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Contents</p>
              <Document
                file={currentDoc.file}
                loading={null}
                error={null}
              >
                <Outline
                  onItemClick={handleOutlineItemClick}
                  className="react-pdf__Outline--custom"
                />
              </Document>
            </div>
          </div>
        )}

        {/* PDF render area */}
        <div
          ref={pageContainerRef}
          className="flex-1 overflow-auto bg-gray-900 flex justify-center"
        >
          <Document
            file={currentDoc.file}
            onLoadSuccess={onLoadSuccess}
            loading={
              <div className="text-gray-400 mt-16 text-center">
                <div className="text-2xl mb-2">📄</div>
                Loading PDF…
              </div>
            }
            error={
              <div className="text-red-400 mt-16 text-center">
                <div className="text-2xl mb-2">⚠️</div>
                Failed to load PDF. Make sure the file is in the public folder.
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer
              renderAnnotationLayer
              className="shadow-2xl my-4"
            />
          </Document>
        </div>
      </div>
    </div>
  );
};

export default RulesViewer;
