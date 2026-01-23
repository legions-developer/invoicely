import { ModernCardContainer, ModernCardDescription, ModernCardTitle } from "@/components/ui/modern-card";
import { FancyBadgeWithBorders } from "@/components/ui/fancy-badges";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Sponsor {
  name: string;
  image: string | null;
  description: string;
  imageClass: string;
  invert?: boolean;
  label?: string;
  link?: string;
}

const sponsors: Sponsor[] = [
  {
    name: "Vercel",
    label: "Open Source Program",
    invert: true,
    imageClass: "h-20 w-40",
    image: "https://assets.invoicely.gg/vercel-logo.png",
    description:
      "Vercel is a platform for building modern web applications. It provides a seamless development experience with a focus on performance and scalability. Vercel provides the developer tools and cloud infrastructure to build, scale, and secure a faster, more personalized web.",
  },
  {
    name: "NeonDB",
    label: "Best Database Service",
    imageClass: "h-20 w-40",
    image: "/social/neondb.svg",
    description:
      "NeonDB is a modern, open-source database that provides a seamless database. The database developers trust, on a serverless platform designed to help you build reliable and scalable applications faster.",
  },
  {
    name: "Cloudflare",
    label: "Open Source Program",
    imageClass: "h-20 w-40",
    image: "https://assets.invoicely.gg/cloudflare-logo.png",
    description:
      "Cloudflare is a global CDN that provides a secure and fast way to deliver content to your users. Cloudflare make websites, apps, and networks faster and more secure. Our developer platform is the best place to build modern apps and deliver AI initiatives.",
  },
  // {
  //   name: "v0.Dev",
  //   label: "#1 Design Tool",
  //   invert: true,
  //   imageClass: "h-20 w-22",
  //   image: "https://assets.invoicely.gg/v0-logo.png",
  //   description:
  //     "Generate UI, build full-stack apps, ask questions, and more. v0.Dev is the best way to build your next project. ",
  // },
  // Add Company Here
  {
    name: "Your Company Here",
    label: "Free Sponsor",
    imageClass: "h-20 w-40",
    image: null,
    description:
      "Invoicely is free for everyone—forever. If you'd like to sponsor us with a service that benefits our platform and users, contact us below.",
    link: "mailto:admin@legions.dev",
  },
];

const OurSponser = () => {
  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-col items-center border-b border-dashed py-4">
        <FancyBadgeWithBorders>Our Sponsors</FancyBadgeWithBorders>
      </div>
      <div className="flex flex-col">
        {sponsors.map((sponsor, index) => (
          <div
            key={sponsor.name}
            className={cn("grid grid-flow-row grid-cols-1 border-b border-dashed sm:grid-cols-3 md:h-[150px]")}
          >
            <ModernCardContainer className={cn("flex flex-col p-6 sm:col-span-2", index % 2 === 0 && "sm:order-1")}>
              <ModernCardTitle label={sponsor.label}>{sponsor.name}</ModernCardTitle>
              <ModernCardDescription>{sponsor.description}</ModernCardDescription>
              {sponsor.link && (
                <Link className="mt-1" href={sponsor.link}>
                  <Button variant="white" size="xs">
                    Contact Us
                  </Button>
                </Link>
              )}
            </ModernCardContainer>
            <ModernCardContainer
              className={cn(
                index === sponsors.length - 1 && "!p-2",
                index % 2 === 0 ? "sm:border-r" : "sm:border-l",
                "flex flex-col items-center justify-center border-none p-6 sm:border-dashed",
              )}
            >
              {sponsor.image ? (
                <Image
                  className={cn("object-contain", sponsor.invert && "invert dark:invert-0", sponsor.imageClass)}
                  src={sponsor.image}
                  alt={sponsor.name}
                  width={254}
                  height={254}
                />
              ) : (
                <div className="bg-dashed flex h-full w-full items-center justify-center rounded-md px-10 py-5">
                  <span className="jetbrains-mono bg-background text-muted-foreground rounded-sm px-2 py-1 text-center text-xs">
                    Your Image Here
                  </span>
                </div>
              )}
            </ModernCardContainer>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OurSponser;
