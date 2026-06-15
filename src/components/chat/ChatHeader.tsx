"use client";

import Link from "next/link";
import type { AudienceConfig } from "./chatConfig";
import PlumLogo from "./PlumLogo";

type Props = {
  config: AudienceConfig;
  onNewChat: () => void;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
};

export default function ChatHeader({ config, onNewChat, onToggleSidebar, showSidebarToggle }: Props) {
  return (
    <header className="z-30 w-full shrink-0 border-b border-black/5 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="flex h-14 w-full items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {showSidebarToggle && onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Open claim history"
              className="rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-text lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <PlumLogo className="h-6 w-auto shrink-0" />
          <div className="hidden h-5 w-px bg-border sm:block" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{config.title}</p>
            <p className="truncate text-xs text-text-muted">{config.subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href={config.portalLink.href}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-surface-muted hover:text-text md:inline-block"
          >
            {config.portalLink.label}
          </Link>
          <button
            type="button"
            onClick={onNewChat}
            className="rounded-lg bg-plum-brand px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-plum-brand-dark sm:px-4"
          >
            {config.newClaimLabel}
          </button>
        </div>
      </div>
    </header>
  );
}
