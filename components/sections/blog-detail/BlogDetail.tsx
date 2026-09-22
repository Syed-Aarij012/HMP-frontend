import Link from "next/link";
import Image from "@/components/common/AppImage";
import BlogSidebar from "@/components/common/BlogSidebar";
import LeaveReplyForm from "@/components/common/LeaveReplyForm";
import type { Blog } from "@/types/blogs";

type BlogDetailProps = {
  blog: Blog;
};

function BlogDetail({ blog }: BlogDetailProps) {
  const detailImage = blog.detailImage ?? blog.image;
  const detailImage2 = blog.detailImage2 ?? blog.image;

  return (
    <>
      <section className="tf-section3 flat-blog-detail flat-property-detail">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <div className="post">
                <h1 className="title-heading fs-40 fw-7">{blog.title}</h1>
                <div className="icon-boxs flex flex-wrap gap-16">
                  <div className="flex-three gap-16 infor">
                    <div className="image">
                      <Image
                        src={blog.authorAvatar ?? "/assets/images/blog/avata.webp"}
                        alt={blog.author}
                        width={60}
                        height={60}
                        className="br-100"
                      />
                    </div>
                    <div className="content">
                      <span className="fw-7 text-color-2 fs-14">
                        By {blog.author}
                      </span>
                      <p className="fw-4 fs-12">{blog.publishedAt}</p>
                    </div>
                  </div>
                  <div className="icon flex align-center">
                    <span className="fw-7 text-color-3 fs-14">
                      <a href="#">{blog.tag}</a>
                    </span>
                  </div>
                  <div className="icon flex align-center">
                    <i className="icon-carus-chattext" />
                    <span className="fs-14 fw-4 text-color-2">
                      Comment: {blog.commentCount}
                    </span>
                  </div>
                </div>
                <div className="texts-1 fs-16 fw-5 lh-22 text-color-2 mb-40">
                  {blog.intro}
                </div>
                <div className="image mb-40">
                  <Image
                    src={detailImage}
                    alt={blog.title}
                    width={1416}
                    height={710}
                  />
                </div>
                <div className="mb-40">
                  <h2 className="fs-30 fw-5 mb-16">Why The Leaf Matters</h2>
                  <p className="texts-2 mb-20">
                    Aliquam quis nisl neque. Quisque feugiat ornare nunc, sit
                    amet varius sapien pharetra ut. Nullam sollicitudin, arcu id
                    efficitur rhoncus, ante lectus consequat metus, in tincidunt
                    nibh purus et mi. Aliquam eu tortor aliquam, cursus urna
                    scelerisque, ultricies neque. Donec tempor sodales
                    malesuada.
                  </p>
                  <p className="texts-2 mb-20">
                    Nulla hendrerit, elit non tempor ultricies, diam mauris
                    imperdiet elit, eu sagittis urna libero at lectus.
                    Pellentesque habitant morbi tristique senectus et netus et
                    malesuada fames ac turpis egestas. Praesent malesuada, velit
                    eu tincidunt gravida, arcu enim tempus lorem, et imperdiet
                    ipsum diam in nisi. Etiam condimentum libero eget dui
                    dignissim finibus. Sed sollicitudin elit id dolor
                    vestibulum, nec tempor ante fringilla. Morbi suscipit
                    feugiat sem, et volutpat ipsum scelerisque vel. Mauris erat
                    nibh, fringilla at magna non, pretium pretium neque.
                  </p>
                  <p className="texts-2 mb-20">
                    Ut vehicula nunc cursus ornare euismod. Vestibulum pretium
                    ex vel ipsum ultricies, et scelerisque purus dictum. Etiam
                    eu eros maximus, cursus nisi a, laoreet sapien. Etiam id ex
                    ante. Vivamus nec elit nisi. Quisque nulla dolor, aliquam eu
                    ante in, tincidunt tempus lorem. Fusce porttitor efficitur
                    sapien sed tristique.
                  </p>
                </div>
                <div className="text-box">
                  <div className="icon">
                    <i className="icon-carus-quote2" />
                  </div>
                  <p className="texts  text-color-2">
                    “Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Pellentesque dui dui, laoreet eget libero quis, maximus
                    cursus metus. Integer id nibh sit amet purus congue mollis.
                    ”
                  </p>
                  <span className="fs-16 text-color-2 fw-6">
                    said Mike Fratantoni, MBA’s chief economist.
                  </span>
                </div>
                <div className="image mb-40">
                  <Image
                    src={detailImage2}
                    alt={blog.title}
                    width={1416}
                    height={710}
                  />
                </div>
                <div className="mb-40">
                  <h2 className="fs-30 fw-5 mb-16">What’s Good</h2>
                  <p className="texts-2 mb-20">
                    Aenean congue vestibulum ipsum, ut dapibus mauris viverra
                    ac. Donec sed nisl ac mauris convallis fringilla. In luctus
                    ornare nisi. Nunc aliquam vitae enim nec mattis.
                  </p>
                  <p className="texts-2 mb-20">
                    Vivamus nulla ligula, suscipit eget ante tincidunt, euismod
                    venenatis ipsum.
                  </p>
                  <p className="texts-2 mb-20">
                    Donec quis euismod lectus. Nunc suscipit bibendum libero.
                    Nunc et ornare nisi, in porta leo. Donec suscipit eros orci,
                    sodales rhoncus nibh pulvinar in. Morbi porttitor
                    consectetur nisl, ac pulvinar nulla viverra quis. Aliquam
                    velit augue, accumsan in ante condimentum, mattis hendrerit
                    nisi. Mauris turpis ante, pretium et porttitor vitae,
                    vehicula ut nulla.
                  </p>
                  <p className="texts-2 mb-20">
                    Suspendisse orci erat, vehicula sed cursus quis, commodo id
                    est. In eleifend elementum velit nec condimentum.
                    Suspendisse sollicitudin mauris quis erat maximus, vel
                    fermentum tortor luctus. Morbi sed eros ipsum. Vestibulum
                    sit amet ex eget lacus tempor aliquam. Nulla iaculis quis
                    justo vitae tincidunt. Maecenas eget felis non ipsum
                    tincidunt dignissim sed eu enim. Mauris nec arcu diam. Morbi
                    sit amet justo ante.
                  </p>
                </div>
                <div className="tag-wrap flex flex-wrap justify-space align-center gap-8">
                  <div className="tags-box">
                    <div className="tags flex-three">
                      <p className="text-color-2 fw-5 font">Tags:</p>
                      <div className="flex fs-13 fw-6 link-style-1">
                        {(blog.tags ?? ["Carus", "BMW"]).map((tag) => (
                          <Link href="/blog" key={tag}>
                            {tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="share-box flex-three">
                    <p className="text-color-2 fw-5 font">Share this post:</p>
                    <div className="icon-social">
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
                      <a
                        href="https://x.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
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
                  </div>
                </div>
                <div className="wrap-review pd-0">
                  <div className="box-title titles">
                    <h2 className="fs-30 fw-5">Comment (4)</h2>
                  </div>
                  <div className="comment-list">
                    <ol className="mb-30">
                      <li>
                        <div className="comment-list-wrap flex">
                          <div className="images flex-none">
                            <Image
                              src="/assets/images/blog/avt1.webp"
                              alt="images"
                              width={90}
                              height={90}
                            />
                          </div>
                          <div className="content">
                            <div className="flex-two">
                              <h5 className="fs-18 fw-5">Marvin McKinney</h5>
                              <p className="fs-12 fw-4 lh-16">
                                August 13, 2023
                              </p>
                            </div>
                            <div className="icon-star flex-three">
                              <i className="icon-carus-star" />
                              <i className="icon-carus-star" />
                              <i className="icon-carus-star" />
                              <i className="icon-carus-star" />
                              <i className="icon-carus-star" />
                            </div>
                          </div>
                        </div>
                        <p className="texts text-color-2">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit. Morbi lacinia sit amet elit sed molestie. Sed
                          neque enim, iaculis id viverra in, scelerisque vitae
                          nulla.&nbsp;
                        </p>
                        <div className="flex-three gap-16 flex-wrap mb-16">
                          <Image
                            width={141}
                            height={79}
                            src="/assets/images/blog/cmt1.webp"
                            alt="images"
                          />
                          <Image
                            width={141}
                            height={79}
                            src="/assets/images/blog/cmt2.webp"
                            alt="images"
                          />
                          <Image
                            width={141}
                            height={79}
                            src="/assets/images/blog/cmt3.webp"
                            alt="images"
                          />
                        </div>
                        <div className="flex-three">
                          <p className="fs-14 fw-4">Is this review helpful?</p>
                          <div className="helpful">
                            <a href="#" className="fs-12 fw-4 font-2">
                              Yes
                            </a>
                            <a href="#" className="fs-12 fw-4 font-2">
                              No
                            </a>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="comment-list-wrap flex">
                          <div className="images flex-none">
                            <Image
                              src="/assets/images/blog/avt2.webp"
                              alt="images"
                              width={90}
                              height={90}
                            />
                          </div>
                          <div className="content">
                            <div className="flex-two">
                              <h5 className="fs-18 fw-5">Jenny Wilson</h5>
                              <p className="fs-12 fw-4 lh-16">
                                August 13, 2023
                              </p>
                            </div>
                            <div className="icon-star flex-three">
                              <i className="icon-carus-star" />
                              <i className="icon-carus-star" />
                              <i className="icon-carus-star" />
                              <i className="icon-carus-star" />
                              <i className="icon-carus-star" />
                            </div>
                          </div>
                        </div>
                        <p className="texts text-color-2">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit. Morbi lacinia sit amet elit sed molestie. Sed
                          neque enim, iaculis id viverra in, scelerisque vitae
                          nulla.&nbsp;
                        </p>
                        <div className="flex-three">
                          <p className="fs-14 fw-4">Is this review helpful?</p>
                          <div className="helpful">
                            <a href="#" className="fs-12 fw-4 font-2">
                              Yes
                            </a>
                            <a href="#" className="fs-12 fw-4 font-2">
                              No
                            </a>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="comment-list-wrap flex">
                          <div className="images flex-none">
                            <Image
                              src="/assets/images/blog/avt3.webp"
                              alt="images"
                              width={90}
                              height={90}
                            />
                          </div>
                          <div className="content">
                            <div className="flex-two">
                              <h5 className="fs-18 fw-5">Eleanor Pena</h5>
                              <p className="fs-12 fw-4 lh-16">
                                August 13, 2023
                              </p>
                            </div>
                            <div className="icon-star flex-three">
                              <i className="icon-carus-star" />
                              <i className="icon-carus-star" />
                              <i className="icon-carus-star" />
                              <i className="icon-carus-star" />
                              <i className="icon-carus-star" />
                            </div>
                          </div>
                        </div>
                        <p className="texts text-color-2">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit. Morbi lacinia sit amet elit sed molestie. Sed
                          neque enim, iaculis id viverra in, scelerisque vitae
                          nulla.&nbsp;
                        </p>
                        <div className="flex-three">
                          <p className="fs-14 fw-4">Is this review helpful?</p>
                          <div className="helpful">
                            <a href="#" className="fs-12 fw-4 font-2">
                              Yes
                            </a>
                            <a href="#" className="fs-12 fw-4 font-2">
                              No
                            </a>
                          </div>
                        </div>
                      </li>
                    </ol>
                    <a className="link-btn flex-three" href="#">
                      <span>View more reviews</span>
                      <i className="icon-carus-chev-up" />
                    </a>
                  </div>
                </div>
                <LeaveReplyForm />
              </div>
            </div>
            <div className="col-lg-4">
              <BlogSidebar
                categoryHref="/blog-grid"
                viewMoreHref="/blog"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default BlogDetail;
