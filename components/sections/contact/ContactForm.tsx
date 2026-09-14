"use client";

import Image from "next/image";

export default function ContactForm() {
  return (
    <form
      className="form-contact-us"
      id="contact-form"
      action="#"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="flex-one gap-48">
        <div className="form">
          <div className="form-group">
            <label htmlFor="listing_title">Your name</label>
            <input
              type="text"
              className="form-control"
              name="user_name"
              placeholder="e.g john doe"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="listing_title">Phone number</label>
            <input
              type="tel"
              className="form-control"
              name="user_phone"
              placeholder="e.g (000) 000-0000"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="listing_title">Email</label>
            <input
              type="email"
              className="form-control"
              name="user_email"
              placeholder="e.g johndoe@gmail.com"
              suppressHydrationWarning
              required
            />
          </div>
        </div>
        <div className="image">
          <Image
            className="lazyload"
            data-src="/assets/images/section/contact.jpg"
            src="/assets/images/section/contact.jpg"
            alt="images"
            fill
            sizes="(max-width: 991px) 400px, 542px"
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="listing_title">Message (Optional)</label>
        <input
          type="text"
          className="form-control"
          name="user_message"
          placeholder="Your message"
        />
      </div>
      <div id="contact-response" />
      <div className="form-group mb-0">
        <button type="submit" className="sc-button" id="btn-send-contact">
          <span>Send now</span>
        </button>
      </div>
    </form>
  );
}
