import Link from "next/link";
import Image from "@/components/common/AppImage";
import React from "react";
import RegisterForm from "./RegisterForm";

export default function Register() {
  return (
    <div
      className="modal fade popup login-form register"
      id="popup_bid2"
      tabIndex={-1}
      role="dialog"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <button type="button" className="close" data-bs-dismiss="modal">
            <span className="icon icon-carus-close" />
          </button>
          <div className="modal-body space-y-20 pd-40 style2">
            <div className="wrap-modal flex">
              <div className="content">
                <Link href={`/`} className="logo-image">
                  <Image
                    className="lazyload"
                    data-src="/assets/images/logo/logo@2x.png"
                    src="/assets/images/logo/logo@2x.png"
                    alt="img"
                    width={164}
                    height={32}
                  />
                </Link>
                <div className="header-form">
                  <h1 className="title-login">Register</h1>
                  <p className="text-color-2">
                    HMP is a platform trusted and chosen by over 2,000
                    partners
                  </p>
                </div>
                <div className="comments">
                  <div className="respond-comment">
                    <RegisterForm />
                  </div>
                </div>
                <div className="text-box fs-16">
                  Don’t you have an account?{" "}
                  <a
                    className="font-2 fw-6 fs-16 color-popup text-color-3"
                    data-bs-toggle="modal"
                    data-bs-target="#popup_bid"
                    data-bs-dismiss="modal"
                  >
                    {" "}
                    Login
                  </a>
                </div>
              </div>
              <div className="images relative">
                <Image
                  src="/assets/images/section/resigter.webp"
                  alt="images"
                  width={1595}
                  height={1572}
                />
                <div className="title-section">
                  <h2 className="text-color-1">
                    Effortless Car Selling Maximum Reach
                  </h2>
                  <p className="text-color-1">
                    Our platform is designed for a fast, hassle-free selling
                    experience, giving you the best value for your vehicle with
                    unparalleled market exposure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
