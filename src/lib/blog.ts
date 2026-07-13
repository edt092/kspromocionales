import posts from '@data/blog/posts.json';
import { blogContent } from '@data/blog/content/index.js';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryName: string;
  author: string;
  authorImage?: string;
  authorRole?: string;
  authorLinkedIn?: string;
  date: string;
  dateModified?: string;
  readTime?: string;
  image: string;
  tags?: string[];
  seo?: { metaTitle?: string; metaDescription?: string; keywords?: string };
}

export function getAllPosts(): BlogPost[] {
  return [...(posts as BlogPost[])].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return (posts as BlogPost[]).find((p) => p.slug === slug);
}

export function getPostContent(slug: string): string {
  return (blogContent as Record<string, string>)[slug] ?? '';
}
