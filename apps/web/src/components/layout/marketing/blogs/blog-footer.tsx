import { LINKS } from "@/constants/links";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const links = [
  {
    label: "Home",
    href: LINKS.HOME,
  },
  {
    label: "Create Invoice",
    href: LINKS.CREATE.INVOICE,
  },
];

const BlogFooter = () => {
  return (
    <div className="border-t border-dashed">
      <div className="flex flex-row items-center justify-between p-6">
        <Link className="flex flex-row items-center gap-2" href={LINKS.HOME}>
          <Image src="/official/logo-icon.png" alt="logo" width={32} height={32} />
          <span className="instrument-serif text-xl font-semibold">Invoicely</span>
        </Link>
        <div className="text-muted-foreground flex flex-row items-center gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-secondary-foreground cursor-pointer">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogFooter;
