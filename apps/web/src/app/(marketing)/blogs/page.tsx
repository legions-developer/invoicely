import BlogHeader from "@/components/layout/marketing/blogs/blog-header";
import BlogFooter from "@/components/layout/marketing/blogs/blog-footer";
import BlogHero from "@/components/layout/marketing/blogs/blog-hero";
import BlogCard from "@/components/layout/marketing/blogs/blog-card";
import { allBlogs } from "content-collections";
import { LINKS } from "@/constants/links";
import React from "react";

const Page = () => {
  return (
    <div className="new-container">
      <BlogHeader link={LINKS.HOME} label="Home" />
      <BlogHero isBlogsPage title="Recent Blogs" description="Latest blogs from the Invoicely team" />
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {allBlogs.map((blog, idx) => (
          <BlogCard key={blog.title} blog={blog} idx={idx} length={allBlogs.length} />
        ))}
      </div>
      <BlogFooter />
    </div>
  );
};

export default Page;
