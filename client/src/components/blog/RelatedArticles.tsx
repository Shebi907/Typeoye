import { BlogCard } from './BlogCard';
import type { BlogPost } from '../../data/blog';

interface RelatedArticlesProps {
  posts: BlogPost[];
}

export function RelatedArticles({ posts }: RelatedArticlesProps) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-12">
      <h2
        className="mb-5 text-xl font-bold sm:text-2xl"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Related Articles
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} variant="vertical" />
        ))}
      </div>
    </section>
  );
}