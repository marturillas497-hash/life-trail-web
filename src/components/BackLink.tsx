import Link from "next/link";
import type { ReactNode } from "react";
import { btnBack } from "./ui";

export function BackLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`${btnBack} ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
        <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </Link>
  );
}
