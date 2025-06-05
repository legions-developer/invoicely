/* eslint-disable @next/next/no-img-element */
import { ArrowUpRightIcon } from "lucide-react";
import { allBlogs } from "content-collections";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

interface BlogCardProps {
  blog: (typeof allBlogs)[number];
  idx: number;
  length: number;
}

const BlogCard = ({ blog, idx, length }: BlogCardProps) => {
  return (
    <Link href={`/blog/${blog.slug}`}>
      <div
        className={cn(
          // if elements are last 2 then dont add bottom border
          idx === length - 1 || idx === length - 2 ? "!border-b-0" : "border-r",
          idx % 2 === 0 ? "border-r border-b" : "border-b",
          "group relative flex h-74 w-full cursor-pointer flex-row items-end border-dashed",
        )}
      >
        <ArrowUpRightIcon className="group absolute top-4 right-4 opacity-0 transition-all duration-300 group-hover:opacity-100" />
        <img
          src={blog.thumbnail}
          alt={blog.title}
          className="absolute h-full w-full object-cover opacity-5 transition-all duration-300 group-hover:opacity-25"
        />
        <div className="relative z-10 flex flex-col p-6">
          <h3 className="instrument-serif text-2xl font-bold">{blog.title}</h3>
          <p className="text-muted-foreground line-clamp-2 text-[13px] leading-4 font-light">{blog.summary}</p>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
