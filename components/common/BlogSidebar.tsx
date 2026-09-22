import Image from "@/components/common/AppImage";
import Link from "next/link";
import BlogNewsletterForm from "@/components/common/BlogNewsletterForm";
import BlogSearchForm from "@/components/common/BlogSearchForm";
import {
  BLOG_CATEGORIES,
  BLOG_POPULAR_TAGS,
  getBlogDetailHref,
} from "@/data/blogs";

type BlogSidebarProps = {
  categoryHref?: string;
  viewMoreHref?: string;
};

const FEATURED_LISTINGS = [
  {
    image: "/assets/images/blog/blog-post-1.webp",
    title: "2015 Mitsubishi Triton GLS MQ Auto 4x4 MY16 Double Cab",
    price: "$73,000",
    href: getBlogDetailHref(1),
  },
  {
    image: "/assets/images/blog/blog-post-2.webp",
    title: "2021 Skoda Kushaq 1.0 TSI Style AT",
    price: "$73,000",
    href: getBlogDetailHref(2),
  },
  {
    image: "/assets/images/blog/blog-post-3.webp",
    title: "2012 Mercedes-Benz E-Class 2009-2013 E 200 CGI Avantgarde",
    price: "$73,000",
    href: getBlogDetailHref(3),
  },
  {
    image: "/assets/images/blog/blog-post-4.webp",
    title: "2014 Audi A4 2.0 TDI Multitronic",
    price: "$73,000",
    href: getBlogDetailHref(4),
  },
] as const;

export default function BlogSidebar({
  categoryHref = "/blog",
  viewMoreHref = "/blog-grid",
}: BlogSidebarProps) {
  return (
    <aside className="side-bar side-bar-1 side-blog">
      <div className="inner-side-bar">
        <div className="widget widget-rent">
          <div className="flat-tabs style2">
            <div className="form-s2">
              <BlogSearchForm />
            </div>
          </div>
        </div>
        <div className="widget widget-categories">
          <h4 className="widget-title">Categories</h4>
          <ul>
            {BLOG_CATEGORIES.map((category) => (
              <li className="flex-two" key={category.label}>
                <Link
                  href={category.href ?? categoryHref}
                  className="font-2 fw-7"
                >
                  {category.label}
                </Link>
                <div className="numbers">({category.count})</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="widget widget-listings">
          <h4 className="widget-title">Featured listings</h4>
          <div className="rencent-post">
            {FEATURED_LISTINGS.map((listing) => (
              <div className="box-listings flex hover-img3" key={listing.title}>
                <div className="img-listings img-style3">
                  <Image
                    className="lazyload"
                    src={listing.image}
                    alt={listing.title}
                    width={195}
                    height={147}
                  />
                </div>
                <div className="content link-style-2">
                  <Link className="fs-16 lh-22 fw-5" href={listing.href}>
                    {listing.title}
                  </Link>
                  <span className="price">{listing.price}</span>
                </div>
              </div>
            ))}
          </div>
          <Link className="link-btn font-2 flex-three" href={viewMoreHref}>
            <span>View more reviews</span>
            <i className="icon-carus-chev-up" />
          </Link>
        </div>
        <div className="widget newsletter">
          <h4 className="widget-title title-news">Join our newsletter</h4>
          <div className="form-s2">
            <BlogNewsletterForm />
          </div>
        </div>
        <div className="widget widget-tags">
          <h4 className="widget-title title-tags">Popular tags</h4>
          <div className="tags_cloud_inner">
            {BLOG_POPULAR_TAGS.map((tag) => (
              <Link href="/blog" key={tag}>
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
