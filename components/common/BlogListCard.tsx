import Image from "@/components/common/AppImage";
import Link from "next/link";
import { getBlogDetailHref } from "@/data/blogs";
import type { Blog } from "@/types/blogs";

type BlogListCardProps = {
  blog: Blog;
};

function BlogShareIcons() {
  return (
    <div className="icon-social style1">
      <a
        href="https://www.facebook.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="icon-carus-facebook" />
      </a>
      <a
        href="https://www.linkedin.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="icon-carus-in" />
      </a>
      <a href="https://x.com/" target="_blank" rel="noopener noreferrer">
        <i className="icon-carus-x" />
      </a>
      <a
        href="https://www.instagram.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="icon-carus-instagram" />
      </a>
    </div>
  );
}

export default function BlogListCard({ blog }: BlogListCardProps) {
  const detailHref = getBlogDetailHref(blog.id);

  return (
    <div className="box hover-img">
      <div className="images img-style relative flex-none">
        <Link href={detailHref}>
          <Image
            className="lazyload"
            src={blog.image}
            alt={blog.title}
            width={blog.imageWidth ?? 1416}
            height={blog.imageHeight ?? 797}
          />
        </Link>
        <div className="date fs-14 fw-5">{blog.date}</div>
      </div>
      <div className="content">
        <h3 className="fs-24">
          <Link href={detailHref}>{blog.title}</Link>
        </h3>
        <div className="sub-box flex align-center fs-14 fw-6 flex-wrap">
          <div className="meta title-1">By {blog.author}</div>
          <a href="#" className="meta text-color-3">
            {blog.tag}
          </a>
          <div className="meta title-2 fw-4 flex-three">
            {blog.commentCount}
          </div>
        </div>
        <p className="mt-32">{blog.excerpt}</p>
        <div className="flex-two mt-32 flex-wrap gap-30">
          <Link className="sc-button btn-1 flex-1" href={detailHref}>
            <span>Read more</span>
          </Link>
          <div className="social-listing flex-six flex-wrap">
            <p className="fs-14 fw-4">Share this post:</p>
            <BlogShareIcons />
          </div>
        </div>
      </div>
    </div>
  );
}
