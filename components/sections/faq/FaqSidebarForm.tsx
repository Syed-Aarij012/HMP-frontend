"use client";

export default function FaqSidebarForm() {
  return (
    <form
      action=""
      className="form-sidebar-faq"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="form-group">
        <label htmlFor="listing_title">Message (Optional)</label>
        <input
          type="text"
          className="form-control"
          name="listing_title"
          placeholder="Your message"
          defaultValue=""
        />
      </div>
      <div className="form-group">
        <label htmlFor="listing_title">Your name</label>
        <input
          type="text"
          className="form-control"
          name="listing_title"
          placeholder="e.g john doe"
          defaultValue=""
        />
      </div>
      <div className="form-group">
        <label htmlFor="listing_title">Email</label>
        <input
          type="email"
          className="form-control"
          name="listing_title"
          placeholder="e.g johndoe@gmail.com"
          suppressHydrationWarning
          defaultValue=""
        />
      </div>
      <div className="form-group">
        <input
          type="submit"
          className="sc-button"
          name="listing_title"
          defaultValue="Send"
        />
      </div>
    </form>
  );
}
