"use client";

import { PostHogAnalytics } from "@/components/ui/posthog-analytics";
import OpenSourceBadge from "@/components/ui/open-source-badge";
import { useGithubStars } from "@/hooks/use-github-stars";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { ScribbledArrowToRight } from "@/assets/svgs";
import LogoIcon from "@/components/assets/logo-icon";
import { Button } from "@/components/ui/button";
import NumberFlow from "@number-flow/react";
import { useTheme } from "next-themes";
import { LINKS } from "@/constants";
import Link from "next/link";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const { stars, error } = useGithubStars();

  return (
    <div className="flex h-screen items-center justify-center">
      <hr className="absolute top-12 left-0 h-px w-full border-dashed sm:top-24" />
      <hr className="absolute bottom-12 left-0 h-px w-full border-dashed sm:bottom-24" />
      <hr className="absolute top-0 left-12 h-full w-px border-l border-dashed sm:left-24" />
      <hr className="absolute right-12 bottom-0 h-full w-px border-r border-dashed sm:right-24" />
      <div className="flex flex-col items-center justify-center gap-2">
        {!error && (
          <Link href={LINKS.SOCIALS.GITHUB} target="_blank">
            <div className="bg-secondary-foreground/5 relative mb-4 flex items-center gap-2 rounded-lg px-4 py-1">
              <span className="urbanist absolute -top-6 left-32 size-full -rotate-[34deg] text-xs opacity-15">
                Give Star <br /> please :3 <br /> for cookie
              </span>
              <ScribbledArrowToRight className="absolute top-4 left-18 size-full rotate-[190deg] opacity-15" />
              <StarFilledIcon className="size-5 text-yellow-500" />
              <NumberFlow className="bricolage-grotesque text-2xl font-bold" value={stars} />
            </div>
          </Link>
        )}
        <OpenSourceBadge />
        <div className="flex items-center gap-3">
          <LogoIcon />
          <div className="instrument-serif text-5xl font-semibold">Invoicely</div>
        </div>
        <p className="text-muted-foreground text-center text-sm">The easiest way to create and send invoices</p>
        <div className="mt-4 flex gap-2">
          <PostHogAnalytics
            analytics={{
              name: "get-started-button-click",
              group: "landing-page",
            }}
          >
            <Link href={LINKS.CREATE.INVOICE}>
              <Button>Get Started</Button>
            </Link>
          </PostHogAnalytics>
          <Button variant="secondary" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            Switch Theme
          </Button>
        </div>
      </div>
    </div>
  );
}
