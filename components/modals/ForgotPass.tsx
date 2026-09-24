import Link from "next/link";
import Image from "@/components/common/AppImage";
import React from "react";
import ForgotPassForm from "./ForgotPassForm";

export default function ForgotPass() {
  return (
    <div
      className="modal fade popup login-form password"
      id="popup_bid3"
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
                    data-src="/assets/images/WhatsApp_Image_2026-09-14_at_3.32.30_PM-removebg-preview.png"
                    src="/assets/images/WhatsApp_Image_2026-09-14_at_3.32.30_PM-removebg-preview.png"
                    alt="HMP"
                    width={100}
                    height={50}
                  />
                </Link>
                <div className="header-form">
                  <h1 className="title-login">Forgot password?</h1>
                  <p className="text-color-2">
                    No worries, we’ll send you reset instructions.
                  </p>
                </div>
                <div className="comments">
                  <div className="respond-comment">
                    <ForgotPassForm />
                  </div>
                </div>
              </div>
              <div className="images relative">
                <Image
                  src="/assets/images/section/password.webp"
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
