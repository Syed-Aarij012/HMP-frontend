import Image from "@/components/common/AppImage";
import Link from "next/link";
import { getBlogDetailHref } from "@/data/blogs";
import type { Blog } from "@/types/blogs";

type BlogSwiperCardVariant = "style1" | "style6";

type BlogSwiperCardProps = {
  blog: Blog;
  variant?: BlogSwiperCardVariant;
  showCommentCount?: boolean;
};

export default function BlogSwiperCard({
  blog,
  variant = "style1",
  showCommentCount = true,
}: BlogSwiperCardProps) {
  const detailHref = getBlogDetailHref(blog.id);

  if (variant === "style6") {
    return (
      <div className="blog-article-item style6 hover-img">
        <div className="images img-style relative flex-none">
          <Image
            className="lazyload"
            data-src={blog.image}
            src={blog.image}
            alt={blog.title}
            width={blog.imageWidth ?? 690}
            height={blog.imageHeight ?? 444}
          />
          <div className="date">{blog.date}</div>
        </div>
        <div className="content">
          <div className="sub-box flex align-center fs-14 fw-7 flex-wrap">
            <div className="meta title-1 text-color-2">By {blog.author}</div>
            <a href="#" className="meta text-color-3">
              {blog.tag}
            </a>
            {showCommentCount && (
              <div className="meta title-2 fw-7 flex-three text-color-2">
                {blog.commentCount}
              </div>
            )}
          </div>
          <h3>
            <Link href={detailHref}>{blog.title}</Link>
          </h3>
          <Link href={detailHref} className="tf-btn-arrow">
            Read More
            <i className=" icon-carus-arright" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-article-item style1 hover-img">
      <div className="images img-style relative flex-none">
        <Image
          className="lazyload"
          data-src={blog.image}
          src={blog.image}
          alt={blog.title}
          width={blog.imageWidth ?? 690}
          height={blog.imageHeight ?? 444}
        />
        <div className="date">{blog.date}</div>
      </div>
      <div className="content">
        <h3>
          <Link href={detailHref}>{blog.title}</Link>
        </h3>
        <div className="sub-box flex align-center fs-14 fw-6 flex-wrap">
          <div className="meta title-1 text-color-2">By {blog.author}</div>
          <a href="#" className="meta text-color-3">
            {blog.tag}
          </a>
          {showCommentCount && blog.commentCount > 0 && (
            <div className="meta title-2 fw-7 flex-three text-color-2">
              {blog.commentCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
