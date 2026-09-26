import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Clock,
  Sparkles,
  Zap,
  Package,
  ShoppingCart,
  UserPlus,
  FileText,
  Truck,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { navigation, type NavigationItem } from './layout/Sidebar';

const RECENT_KEY = 'bb-admin-recent-commands';
const RECENT_MAX = 5;

/** A palette entry: a destination plus the words that should find it. */
interface Command {
  id: string;
  label: string;
  group: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string;
}

/** Jump straight to the things an admin does most, from anywhere. */
const QUICK_ACTIONS: Command[] = [
  {
    id: 'action:shipment',
    label: 'Create shipment',
    group: 'Quick actions',
    href: '/orders/create-shipment',
    icon: Truck,
    keywords: 'create shipment dispatch book courier new',
  },
  {
    id: 'action:product',
    label: 'Add product',
    group: 'Quick actions',
    href: '/products/create',
    icon: Package,
    keywords: 'add product create new book upload',
  },
  {
    id: 'action:order',
    label: 'Go to orders',
    group: 'Quick actions',
    href: '/orders',
    icon: ShoppingCart,
    keywords: 'orders sales list',
  },
  {
    id: 'action:customer',
    label: 'Add customer',
    group: 'Quick actions',
    href: '/customers/create',
    icon: UserPlus,
    keywords: 'add customer create new user',
  },
  {
    id: 'action:refund',
    label: 'Process refunds',
    group: 'Quick actions',
    href: '/payments/refunds',
    icon: FileText,
    keywords: 'refund money return',
  },
];

/**
 * Flatten the sidebar tree into palette entries.
 *
 * Only leaves are used: group hrefs like `/sales` and `/catalog` are not real
 * routes (they only exist to open a collapsible section in the sidebar), so
 * navigating to them would 404.
 */
const buildPageCommands = (): Command[] => {
  const out: Command[] = [];

  const walk = (items: NavigationItem[], parentGroup: string) => {
    items.forEach((item) => {
      if (item.children?.length) {
        walk(item.children, item.name);
        return;
      }

      out.push({
        id: `page:${item.href}`,
        label: item.name,
        group: parentGroup,
        href: item.href,
        icon: item.icon,
        // Parent name is searchable too, so "affiliate payouts" is reachable
        // from either word.
        keywords: `${item.name} ${parentGroup}`.toLowerCase(),
      });
    });
  };

  walk(navigation, 'Pages');

  return out;
};

const PAGE_COMMANDS = buildPageCommands();

/**
 * Subsequence match, the same idea as VS Code's quick open.
 *
 * Returns a score so exact and prefix matches rank above scattered ones
 * ("ref" beats "r-e-f" deep inside an unrelated word), plus the matched
 * character offsets so the UI can highlight them.
 */
const fuzzyMatch = (query: string, target: string): { score: number; indices: number[] } | null => {
  if (!query) return { score: 1, indices: [] };

  const q = query.toLowerCase();
  const t = target.toLowerCase();

  const direct = t.indexOf(q);
  if (direct !== -1) {
    const indices = Array.from({ length: q.length }, (_, i) => direct + i);
    // A prefix match is the strongest signal, a mid-word match weaker.
    return { score: 1000 - direct * 2 - (t.length - q.length), indices };
  }

  const indices: number[] = [];
  let score = 0;
  let cursor = 0;
  let streak = 0;

  for (let qi = 0; qi < q.length; qi++) {
    const found = t.indexOf(q[qi], cursor);
    if (found === -1) return null;

    // Reward consecutive characters; a match right after a separator is a
    // word start, which is worth extra.
    if (found === cursor && qi > 0) streak += 1;
    else streak = 0;
    score += 10 + streak * 5;

    if (found === 0 || /[\s/\-_.]/.test(t[found - 1])) {
      score += 15;
    }

    indices.push(found);
    cursor = found + 1;
  }

  return { score: score - t.length * 0.1, indices };
};

const readRecent = (): string[] => {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string').slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
};

const writeRecent = (id: string) => {
  try {
    const next = [id, ...readRecent().filter((v) => v !== id)].slice(0, RECENT_MAX);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private browsing or a full quota — recent items are a nicety, not a
    // requirement, so failing here must never break navigation.
  }
};

interface HighlightedProps {
  text: string;
  indices: number[];
}

/** Render `text` with the fuzzy-matched characters emphasised. */
const Highlighted: React.FC<HighlightedProps> = ({ text, indices }) => {
  if (indices.length === 0) return <>{text}</>;

  const marked = new Set(indices);
  return (
    <>
      {text.split('').map((char, i) =>
        marked.has(i) ? (
          <span key={i} className="text-primary-600 font-semibold">
            {char}
          </span>
        ) : (
          <span key={i}>{char}</span>
        )
      )}
    </>
  );
};

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Global ⌘K / Ctrl+K command palette.
 *
 * Searches every page in the sidebar tree plus a handful of one-tap actions.
 * There is no cmdk dependency in this project, so the fuzzy matcher, the
 * keyboard handling and the list virtualisation-free rendering are all local.
 */
const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);

  const allCommands = useMemo(() => [...QUICK_ACTIONS, ...PAGE_COMMANDS], []);

  // Reload recents each time it opens, so an entry used in another tab shows up.
  useEffect(() => {
    if (open) {
      setRecent(readRecent());
      setQuery('');
      setActiveIndex(0);
      // Focus after the dialog has actually mounted.
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo((): Array<{ command: Command; indices: number[] }> => {
    const trimmed = query.trim();

    if (!trimmed) {
      // Empty state: recents first (if any), then the quick actions.
      const recentCommands = recent
        .map((id) => allCommands.find((c) => c.id === id))
        .filter((c): c is Command => Boolean(c));
      const rest = QUICK_ACTIONS.filter((c) => !recent.includes(c.id));
      return [...recentCommands, ...rest].map((command) => ({ command, indices: [] }));
    }

    return allCommands
      .map((command) => {
        const label = fuzzyMatch(trimmed, command.label);
        const keywords = fuzzyMatch(trimmed, command.keywords);
        if (!label && !keywords) return null;
        return {
          command,
          score: Math.max(label?.score ?? -Infinity, (keywords?.score ?? -Infinity) * 0.4),
          indices: label?.indices ?? [],
        };
      })
      .filter((r): r is { command: Command; score: number; indices: number[] } => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((r) => ({ command: r.command, indices: r.indices }));
  }, [query, recent, allCommands]);

  // Group the flat result list for rendering, preserving relevance order.
  const grouped = useMemo(() => {
    const out: Array<{ group: string; items: Array<{ command: Command; indices: number[] }> }> = [];
    results.forEach((entry) => {
      const last = out[out.length - 1];
      if (last && last.group === entry.command.group) last.items.push(entry);
      else out.push({ group: entry.command.group, items: [entry] });
    });
    return out;
  }, [results]);

  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, grouped]);

  const run = useCallback(
    (command: Command) => {
      writeRecent(command.id);
      setRecent(readRecent());
      onClose();
      navigate(command.href);
    },
    [navigate, onClose]
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = flat[activeIndex];
      if (target) run(target.command);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  // Tab cycles through results rather than leaving the dialog.
  const onTab = (event: React.KeyboardEvent) => {
    if (!flat.length) return;
    event.preventDefault();
    setActiveIndex((i) => (event.shiftKey ? (i - 1 + flat.length) % flat.length : (i + 1) % flat.length));
  };

  let runningIndex = -1;

  return (
    <Transition appear show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose} initialFocus={inputRef as never}>
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-[2px]" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-4 pt-[8vh] sm:pt-[12vh]">
          <div className="flex min-h-full items-start justify-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 -translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95 -translate-y-2"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-900/5">
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-gray-100 px-4">
                  <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActiveIndex(0);
                    }}
                    onKeyDown={(event) => {
                      onKeyDown(event);
                      onTab(event);
                    }}
                    placeholder="Jump to a page or run an action…"
                    className="h-14 flex-1 border-0 bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                  />
                  <kbd className="hidden shrink-0 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-gray-400 sm:block">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <div
                  ref={listRef}
                  className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain p-2"
                  role="listbox"
                  aria-label="Commands"
                >
                  {flat.length === 0 ? (
                    <div className="px-3 py-10 text-center">
                      <p className="text-sm text-gray-500">
                        Nothing matches “<span className="font-medium text-gray-700">{query}</span>”
                      </p>
                      <p className="mt-1 text-xs text-gray-400">Try a shorter word — “ord”, “prod”, “refund”.</p>
                    </div>
                  ) : (
                    grouped.map((section) => (
                      <div key={section.group} className="mb-1 last:mb-0">
                        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          {section.group}
                        </p>
                        {section.items.map((entry) => {
                          runningIndex += 1;
                          const index = runningIndex;
                          const isActive = index === activeIndex;
                          const Icon = entry.command.icon;

                          return (
                            <button
                              key={entry.command.id}
                              type="button"
                              data-active={isActive}
                              role="option"
                              aria-selected={isActive}
                              // Staggered reveal, capped so long lists do not
                              // take half a second to appear.
                              style={{ animationDelay: `${Math.min(index, 12) * 14}ms` }}
                              onMouseMove={() => setActiveIndex(index)}
                              onClick={() => run(entry.command)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left animate-cascade-in',
                                isActive ? 'bg-primary-50' : 'hover:bg-gray-50'
                              )}
                            >
                              <span
                                className={cn(
                                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-colors',
                                  isActive ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm text-gray-900">
                                  <Highlighted text={entry.command.label} indices={entry.indices} />
                                </span>
                                <span className="block truncate text-xs text-gray-400">
                                  {entry.command.href}
                                </span>
                              </span>

                              {isActive && (
                                <CornerDownLeft className="h-3.5 w-3.5 flex-shrink-0 text-primary-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer legend */}
                <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/80 px-4 py-2 text-[11px] text-gray-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-gray-200 bg-white px-1 py-px font-mono">↑</kbd>
                      <kbd className="rounded border border-gray-200 bg-white px-1 py-px font-mono">↓</kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-gray-200 bg-white px-1 py-px font-mono">↵</kbd>
                      open
                    </span>
                    {recent.length > 0 && !query && (
                      <span className="hidden items-center gap-1 sm:flex">
                        <Clock className="h-3 w-3" />
                        recent
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 font-medium text-gray-400">
                    <Sparkles className="h-3 w-3" />
                    {flat.length} result{flat.length === 1 ? '' : 's'}
                  </span>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

/**
 * Listens for ⌘K / Ctrl+K anywhere in the app and calls back when it fires.
 * Kept separate from the palette itself so any component can mount it.
 */
export const useCommandPaletteHotkey = (onOpen: () => void) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key?.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpen();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
};

export default CommandPalette;
