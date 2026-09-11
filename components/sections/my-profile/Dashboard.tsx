"use client";

import DashboardToggle from "@/components/dashboard/DashboardToggle";
import ProfileImageUpload from "@/components/sections/my-profile/ProfileImageUpload";
import { useAuth } from "@/contexts/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      <div id="themesflat-content">
        <DashboardToggle />
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="content-area">
                <main id="main" className="main-content">
                  <div className="tfcl-dashboard">
                    <h1 className="admin-title mb-3">Edit profile</h1>
                    <div className="tfcl-add-listing profile-inner">
                      <div className="profile-group mb-3">
                        <h3 className="form-title">Become Dealer</h3>
                        <div className="dealer-tex">
                          Your current account type is set to dealer, if you
                          want to remove your dealer account, and return to
                          normal account, you must click the button below
                        </div>
                        <div className="group-button-submit left">
                          <button className="pre-btn">
                            Remove dealer account
                          </button>
                        </div>
                      </div>
                      <div className="profile-group mb-3">
                        <h3 className="form-title">Avatar</h3>
                        <ProfileImageUpload
                          inputId="tfcl_avatar"
                          browseButtonId="btnBrowse"
                          pathInputId="txtPath"
                          thumbnailId="tfcl_avatar_thumbnail"
                          name="profile_image"
                          uploadLabel="Upload a new Avatar"
                          defaultImageSrc="/assets/images/dashboard/avt-profile.jpg"
                          imageWidth={158}
                          imageHeight={138}
                          imageAlt="avatar"
                        />
                      </div>
                      <div className="profile-group dealer-poster mb-3">
                        <h3 className="form-title">Dealer poster</h3>
                        <ProfileImageUpload
                          inputId="tfcl_dealer_poster"
                          browseButtonId="btnBrowsePoster"
                          pathInputId="txtPathPoster"
                          thumbnailId="tfcl_dealer_poster_thumbnail"
                          name="dealer_poster"
                          uploadLabel="Upload a new Poster"
                          defaultImageSrc="/assets/images/dashboard/dealer-poster.jpg"
                          imageWidth={264}
                          imageHeight={149}
                          imageAlt="dealer poster"
                        />
                      </div>
                      <div className="profile-group mb-3">
                        <h3 className="form-title">Information</h3>
                        <div className="grid-2 gap-30">
                          <div className="form-group">
                            <label htmlFor="listing_title">First name</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Your name"
                              defaultValue={user?.name ?? ""}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="listing_title">Last name </label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Your name"
                              defaultValue=""
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="listing_title">
                            Your description
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="listing_title"
                            placeholder="Your description"
                            defaultValue=""
                          />
                        </div>
                        <div className="form-group-4">
                          <div className="form-group">
                            <label htmlFor="listing_title">Your phone</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Your phone"
                              name="listing_title"
                              defaultValue=""
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="listing_title">Sales phone</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Job"
                              name="listing_title"
                              defaultValue=""
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="listing_title">Email address</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Email address"
                              name="listing_title"
                              defaultValue={user?.email ?? ""}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="listing_title">Your company</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Your Location"
                              name="listing_title"
                              defaultValue=""
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="listing_title">Position</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Administrative staff"
                            name="listing_title"
                            defaultValue=""
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="listing_title">Location</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Your Location"
                            name="listing_title"
                            defaultValue=""
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="listing_title">Website</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Your Location"
                            name="listing_title"
                            defaultValue=""
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="listing_title">Business hours</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Your Location"
                            name="listing_title"
                            defaultValue=""
                          />
                        </div>
                      </div>
                      <div className="profile-group social-profile mb-3">
                        <h3 className="form-title">Social profile link</h3>
                        <div className="grid-2 gap-30">
                          <div className="form-group">
                            <label htmlFor="listing_title">Facebook</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Your link"
                              defaultValue=""
                            />
                            <div className="icon-social">
                              <i className="icon-carus-facebooklogo" />
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="listing_title">Instagram</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Your link"
                              defaultValue=""
                            />
                            <div className="icon-social">
                              <i className="icon-carus-instagramlogo" />
                            </div>
                          </div>
                        </div>
                        <div className="grid-2 gap-30">
                          <div className="form-group">
                            <label htmlFor="listing_title">X</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Your link"
                              defaultValue=""
                            />
                            <div className="icon-social">
                              <i className="icon-carus-xlogo" />
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="listing_title">Dribbble</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Your link"
                              defaultValue=""
                            />
                            <div className="icon-social">
                              <i className="icon-carus-dribbbleLogo" />
                            </div>
                          </div>
                        </div>
                        <div className="grid-2 gap-30">
                          <div className="form-group">
                            <label htmlFor="listing_title">Linkedin</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Your link"
                              defaultValue=""
                            />
                            <div className="icon-social">
                              <i className="icon-carus-linkedinlogo" />
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="listing_title">Teams</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Your link"
                              defaultValue=""
                            />
                            <div className="icon-social">
                              <i className="icon-carus-microsoftteamslogo" />
                            </div>
                          </div>
                        </div>
                        <div className="grid-2 gap-30">
                          <div className="form-group">
                            <label htmlFor="listing_title">Youtube</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Your link"
                              defaultValue=""
                            />
                            <div className="icon-social">
                              <i className="icon-carus-youtubelogo" />
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="listing_title">Vimeo</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Your link"
                              defaultValue=""
                            />
                            <div className="icon-social">
                              <i className="icon-carus-vimeo" />
                            </div>
                          </div>
                        </div>
                        <div className="grid-2 gap-30">
                          <div className="form-group">
                            <label htmlFor="listing_title">Pinters</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Your link"
                              defaultValue=""
                            />
                            <div className="icon-social">
                              <i className="icon-carus-pinterestlogo" />
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="listing_title">Tiktok</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Your link"
                              defaultValue=""
                            />
                            <div className="icon-social">
                              <i className="icon-carus-tiktoklogo" />
                            </div>
                          </div>
                        </div>
                        <div className="group-button-submit">
                          <button className="pre-btn">Save &amp; Update</button>
                          <button className="second-btn">Reset all</button>
                        </div>
                      </div>
                      <div className="profile-group mb-3">
                        <h3 className="form-title">Change passwords</h3>
                        <div className="tfcl-add-listing profile-password">
                          <div className="form-group">
                            <label htmlFor="listing_title">Old password</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Old password"
                              defaultValue=""
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="listing_title">New password</label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="New password"
                              defaultValue=""
                            />
                          </div>
                          <ul className="list-check-req mb-3">
                            <li className="check">
                              <span>One number</span>
                            </li>
                            <li>
                              <span>One lowercase character</span>
                            </li>
                            <li>
                              <span>One uppercase character</span>
                            </li>
                            <li>
                              <span>8 characters minimum</span>
                            </li>
                          </ul>
                          <div className="form-group">
                            <label htmlFor="listing_title">
                              Confirm password
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="listing_title"
                              placeholder="Confirm password"
                              defaultValue=""
                            />
                          </div>
                          <div className="group-button-submit left mb-0">
                            <button className="pre-btn">
                              Change passwords
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
