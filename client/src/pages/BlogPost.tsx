import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { BlogDetail } from '../components/blog/BlogDetail';
import { POSTS } from '../data/blog';
import type { BlogPost } from '../data/blog';

function getRelated(post: BlogPost, count = 3): BlogPost[] {
  const sameCategory = POSTS.filter((p) => p.slug !== post.slug && p.category === post.category);
  const others = POSTS.filter((p) => p.slug !== post.slug && p.category !== post.category);
  return [...sameCategory, ...others].slice(0, count);
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = POSTS.find((p) => p.slug === slug);
  const related = useMemo(() => (post ? getRelated(post) : []), [post]);

  if (!post) {
    return (
      <PageWrapper noHeader title="Article Not Found">
        <div className="card p-10 text-center">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Article not found
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            The article you are looking for does not exist or may have moved. Try browsing the blog.
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }}
          >
            <ArrowLeft size={15} /> Back to Blog
          </Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper noHeader title={post.title}>
      <BlogDetail post={post} related={related} />
    </PageWrapper>
  );
}