import Image from "@/components/common/AppImage";
import Link from "next/link";
import { getBlogDetailHref } from "@/data/blogs";
import type { Blog } from "@/types/blogs";

type BlogHome03CardProps = {
  blog: Blog;
  variant: "featured" | "compact";
};

export default function BlogHome03Card({ blog, variant }: BlogHome03CardProps) {
  const detailHref = getBlogDetailHref(blog.id);

  if (variant === "featured") {
    return (
      <div className="blog-article-item hover-img ">
        <div className="images img-style relative flex-none">
          <Image
            className=" ls-is-cached lazyloaded"
            data-src={blog.image}
            src={blog.image}
            alt={blog.title}
            width={blog.imageWidth ?? 1116}
            height={blog.imageHeight ?? 645}
          />
          <div className="date">{blog.date}</div>
        </div>
        <div className="content">
          <h3>
            <Link href={detailHref}>{blog.title}</Link>
          </h3>
          <p>{blog.excerpt}</p>
          <div className="sub-box flex align-center fs-14 fw-6 flex-wrap">
            <div className="meta title-1 text-color-2">By {blog.author}</div>
            <a href="#" className="meta text-color-3">
              {blog.tag}
            </a>
            <div className="meta title-2 fw-7 flex-three text-color-2">
              {blog.commentCount}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-article-item style3 hover-img">
      <div className="images img-style relative flex-none">
        <Image
          className=" ls-is-cached lazyloaded"
          data-src={blog.image}
          src={blog.image}
          alt={blog.title}
          width={blog.imageWidth ?? 486}
          height={blog.imageHeight ?? 483}
        />
        <a href="#" className="date fw-4 fs-12 font-2">
          {blog.date}
        </a>
      </div>
      <div className="content">
        <h3>
          <Link href={detailHref}>{blog.title}</Link>
        </h3>
        <p>{blog.excerpt}</p>
        <div className="sub-box flex align-center fs-14 fw-6 flex-wrap">
          <div className="meta title-1 text-color-2">By {blog.author}</div>
          <a href="#" className="meta text-color-3">
            {blog.tag}
          </a>
          <div className="meta title-2 fw-7 flex-three text-color-2">
            {blog.commentCount}
          </div>
        </div>
      </div>
    </div>
  );
}
