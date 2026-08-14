import { useParams } from 'react-router-dom';
import BlogPost from '../components/BlogPost';

/**
 * Post page — Renders a single blog post by slug from the URL.
 */
export default function Post() {
  const { slug } = useParams();

  return <BlogPost slug={slug} />;
}
