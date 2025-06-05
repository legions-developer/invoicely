import { BlogContent } from "@/components/layout/marketing/blogs/blog-content";
import BlogHeader from "@/components/layout/marketing/blogs/blog-header";
import BlogHero from "@/components/layout/marketing/blogs/blog-hero";
import { getTableOfContents } from "fumadocs-core/server";
import { allBlogs } from "content-collections";
import { notFound } from "next/navigation";
import { LINKS } from "@/constants/links";
import { cn } from "@/lib/utils";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const post = allBlogs.find((post) => post._meta.path === slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: post.ogImage ? [{ url: post.ogImage }] : undefined,
    },
  };
}

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const post = allBlogs.find((post) => post._meta.path === slug);
  if (!post) return notFound();

  const toc = getTableOfContents(post.content);

  return (
    <article className={cn("new-container", "instrument-sans")}>
      <BlogHeader link={LINKS.BLOGS} label="All Blogs" />
      <BlogHero blog={post} />
      <BlogContent code={post.mdx} toc={toc} />
    </article>
  );
}
