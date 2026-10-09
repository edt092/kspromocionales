import posts from '@data/blog/posts.json';
import { blogContent } from '@data/blog/content/index.js';
import { resolveSupplierImageUrl } from '@/lib/product-image';

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

// Las imágenes del proveedor se sirven desde su host final (ver resolveSupplierImageUrl).
const withResolvedImage = (p: BlogPost): BlogPost => ({ ...p, image: resolveSupplierImageUrl(p.image) });

export function getAllPosts(): BlogPost[] {
  return [...(posts as BlogPost[])].map(withResolvedImage).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const post = (posts as BlogPost[]).find((p) => p.slug === slug);
  return post && withResolvedImage(post);
}

export function getPostContent(slug: string): string {
  const html = (blogContent as Record<string, string>)[slug] ?? '';
  return html.replace(/https?:\/\/(?:www\.)?catalogospromocionales\.com\/images\//gi, (m) => resolveSupplierImageUrl(m));
}
