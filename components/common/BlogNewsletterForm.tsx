"use client";

export default function BlogNewsletterForm() {
  return (
    <form
      method="post"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="wd-find-select">
        <div className="form-newsletter input-form relative">
          <label className="fs-18 fw-5">Email</label>
          <input
            type="email"
            className="input-field"
            placeholder="Enter your email"
            defaultValue=""
            suppressHydrationWarning
            name="s"
            title="Enter your email"
            required
          />
          <div className="button-submit">
            <button className="submit-field" type="submit">
              Send
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
