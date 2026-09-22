import Image from "@/components/common/AppImage";
import Link from "next/link";
import { getBlogDetailHref } from "@/data/blogs";
import type { Blog } from "@/types/blogs";

type BlogGridCardProps = {
  blog: Blog;
};

export default function BlogGridCard({ blog }: BlogGridCardProps) {
  const detailHref = getBlogDetailHref(blog.id);

  return (
    <div className="box hover-img">
      <div className="images img-style relative flex-none">
        <Link href={detailHref}>
          <Image
            className="lazyload"
            src={blog.image}
            alt={blog.title}
            width={blog.imageWidth ?? 684}
            height={blog.imageHeight ?? 444}
          />
        </Link>
        <div className="date fs-14 fw-5">{blog.date}</div>
      </div>
      <div className="content">
        <h3 className="fs-20 fw-6">
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
      </div>
    </div>
  );
}
