"use client";

import DashboardListingsTable from "@/components/common/DashboardListingsTable";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useMyListings } from "@/hooks/useMyListings";
import { useListingActions } from "@/components/common/ListingActionsContext";

function Dashboard() {
  const { listings, loading, error } = useMyListings();
  const { favoriteIds } = useListingActions();

  const pendingCount = listings.filter((listing) => listing.dashboardStatus === "pending").length;
  const soldCount = listings.filter((listing) => listing.dashboardStatus === "sold").length;

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
                    <h1 className="admin-title">Dashboard</h1>
                    <div className="tfcl-dashboard-overview">
                      <div className="row">
                        <div className="col-sm-6 col-xxl-3">
                          <div className="tfcl-card">
                            <div className="card-body">
                              <div className="tfcl-icon-overview">
                                <svg
                                  width={36}
                                  height={36}
                                  viewBox="0 0 36 36"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M27.4092 14.014H18.6185C17.9319 14.014 17.3626 13.4447 17.3626 12.7582C17.3626 12.0717 17.9319 11.5024 18.6185 11.5024H27.4092C27.7422 11.5024 28.0616 11.6347 28.2971 11.8702C28.5327 12.1057 28.665 12.4252 28.665 12.7582C28.665 13.0913 28.5327 13.4107 28.2971 13.6462C28.0616 13.8817 27.7422 14.014 27.4092 14.014ZM9.82775 15.2866C9.50961 15.2866 9.19148 15.1694 8.94031 14.9182L7.6845 13.6624C7.19892 13.1768 7.19892 12.3731 7.6845 11.8875C8.17008 11.402 8.9738 11.402 9.45938 11.8875L9.82775 12.2559L12.7078 9.3759C13.1933 8.89032 13.9971 8.89032 14.4826 9.3759C14.9682 9.86149 14.9682 10.6652 14.4826 11.1508L10.7152 14.9182C10.4799 15.1538 10.1607 15.2863 9.82775 15.2866ZM27.4092 25.735H18.6185C17.9319 25.735 17.3626 25.1657 17.3626 24.4792C17.3626 23.7927 17.9319 23.2233 18.6185 23.2233H27.4092C27.7422 23.2233 28.0616 23.3557 28.2971 23.5912C28.5327 23.8267 28.665 24.1461 28.665 24.4792C28.665 24.8122 28.5327 25.1316 28.2971 25.3672C28.0616 25.6027 27.7422 25.735 27.4092 25.735ZM9.82775 27.0075C9.50961 27.0075 9.19148 26.8903 8.94031 26.6392L7.6845 25.3833C7.19892 24.8978 7.19892 24.094 7.6845 23.6085C8.17008 23.1229 8.9738 23.1229 9.45938 23.6085L9.82775 23.9768L12.7078 21.0968C13.1933 20.6113 13.9971 20.6113 14.4826 21.0968C14.9682 21.5824 14.9682 22.3861 14.4826 22.8717L10.7152 26.6392C10.4799 26.8747 10.1607 27.0072 9.82775 27.0075Z"
                                    fill="#405FF2"
                                    stroke="white"
                                    strokeWidth="0.7"
                                  />
                                  <path
                                    d="M23.0233 36H12.9767C3.88465 36 0 32.1153 0 23.0233V12.9767C0 3.88465 3.88465 0 12.9767 0H23.0233C32.1153 0 36 3.88465 36 12.9767V23.0233C36 32.1153 32.1153 36 23.0233 36ZM12.9767 2.51163C5.25767 2.51163 2.51163 5.25767 2.51163 12.9767V23.0233C2.51163 30.7423 5.25767 33.4884 12.9767 33.4884H23.0233C30.7423 33.4884 33.4884 30.7423 33.4884 23.0233V12.9767C33.4884 5.25767 30.7423 2.51163 23.0233 2.51163H12.9767Z"
                                    fill="#405FF2"
                                    stroke="white"
                                    strokeWidth="0.7"
                                  />
                                </svg>
                              </div>
                              <div className="content-overview">
                                <h5>Your listings</h5>
                                <div className="tfcl-dashboard-title">
                                  <div className="listing-text d-flex">
                                    <b>{loading ? "-" : listings.length}</b>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-sm-6 col-xxl-3">
                          <div className="tfcl-card">
                            <div className="card-body">
                              <div className="tfcl-icon-overview">
                                <svg
                                  width={36}
                                  height={36}
                                  viewBox="0 0 36 36"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M17.8887 36C17.3062 36 16.834 35.5278 16.834 34.9453C16.834 34.3628 17.3062 33.8906 17.8887 33.8906C26.6508 33.8906 33.7793 26.7621 33.7793 18C33.7793 9.23787 26.6508 2.10938 17.8887 2.10938C17.3062 2.10938 16.834 1.63716 16.834 1.05469C16.834 0.472219 17.3062 0 17.8887 0C22.6966 0 27.2168 1.87235 30.6166 5.27203C34.0164 8.67178 35.8887 13.192 35.8887 18C35.8887 22.808 34.0163 27.3281 30.6166 30.728C27.2168 34.1276 22.6966 36 17.8887 36Z"
                                    fill="#405FF2"
                                  />
                                  <path
                                    d="M26.3615 27.5293C26.223 27.5295 26.0858 27.5023 25.9578 27.4492C25.8298 27.3962 25.7136 27.3184 25.6158 27.2203L17.1431 18.7477C16.9453 18.5499 16.8342 18.2816 16.8342 18.0019V7.41111C16.8342 6.82864 17.3064 6.35642 17.8889 6.35642C18.4713 6.35642 18.9436 6.82864 18.9436 7.41111V17.5651L27.1073 25.7288C27.5192 26.1407 27.5192 26.8085 27.1073 27.2204C27.0094 27.3185 26.8932 27.3963 26.7652 27.4493C26.6372 27.5023 26.5001 27.5295 26.3615 27.5293Z"
                                    fill="#405FF2"
                                  />
                                </svg>
                              </div>
                              <div className="content-overview">
                                <h5>Pending</h5>
                                <div className="tfcl-dashboard-title">
                                  <span>
                                    <b>{loading ? "-" : pendingCount}</b>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-sm-6 col-xxl-3">
                          <div className="tfcl-card">
                            <div className="card-body">
                              <div className="tfcl-icon-overview">
                                <svg
                                  width={36}
                                  height={36}
                                  viewBox="0 0 36 36"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.24026 34.7043C7.78238 34.7043 7.32901 34.5603 6.93863 34.2756C6.60484 34.0347 6.34612 33.7042 6.19241 33.3223C6.03871 32.9404 5.99631 32.5229 6.07013 32.1179L7.73626 22.3923L0.667882 15.5163C0.370511 15.2276 0.160689 14.8609 0.0625688 14.4582C-0.0355513 14.0556 -0.017981 13.6335 0.113257 13.2404C0.239719 12.85 0.473671 12.5032 0.788271 12.2397C1.10287 11.9763 1.48537 11.8068 1.89188 11.7509L11.6513 10.3278L16.0253 1.47513C16.3965 0.721375 17.1548 0.25 18.0008 0.25C18.8468 0.25 19.6039 0.72026 19.9774 1.47625L24.3503 10.3278L34.1153 11.752C34.9421 11.8679 35.6228 12.4383 35.8883 13.2404C36.0194 13.6327 36.0372 14.054 35.9397 14.456C35.8422 14.8579 35.6333 15.2242 35.337 15.5129L31.98 18.7675C31.7641 18.9655 31.4795 19.0715 31.1867 19.063C30.8939 19.0545 30.616 18.932 30.412 18.7218C30.2081 18.5115 30.0942 18.23 30.0945 17.937C30.0949 17.6441 30.2095 17.3629 30.414 17.1531L33.7665 13.9019L23.4413 12.4698C23.2609 12.4437 23.0895 12.3741 22.9419 12.2671C22.7944 12.1601 22.675 12.0189 22.5941 11.8555L17.9591 2.473L13.4063 11.8555C13.3255 12.0187 13.2063 12.1599 13.0589 12.2669C12.9116 12.3739 12.7405 12.4435 12.5603 12.4698L2.21026 13.9773L9.72863 21.193C9.8597 21.32 9.9579 21.4771 10.0147 21.6505C10.0716 21.824 10.0854 22.0087 10.0549 22.1886L8.28638 32.5071L17.4754 27.5864C17.6474 27.4956 17.84 27.451 18.0345 27.457C18.2289 27.4629 18.4184 27.5191 18.5846 27.6201C19.1145 27.9441 19.3125 28.6529 18.9896 29.1839C18.8209 29.4595 18.5599 29.6429 18.2741 29.7093L9.26513 34.4489C8.94917 34.6168 8.59693 34.7048 8.23913 34.7054L8.24026 34.7043Z"
                                    fill="#405FF2"
                                    stroke="white"
                                    strokeWidth="0.5"
                                  />
                                </svg>
                              </div>
                              <div className="content-overview">
                                <h5>Favorites</h5>
                                <div className="tfcl-dashboard-title">
                                  <span>
                                    <b>{favoriteIds.length}</b>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-sm-6 col-xxl-3">
                          <div className="tfcl-card">
                            <div className="card-body">
                              <div className="tfcl-icon-overview">
                                <svg
                                  width={36}
                                  height={36}
                                  viewBox="0 0 36 36"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M32.121 0H3.87893C1.74009 0 0 1.74002 0 3.87886V27.6023C0 29.7411 1.74009 31.4812 3.87893 31.4812H13.0444L17.2541 35.691C17.3521 35.789 17.4683 35.8667 17.5963 35.9197C17.7243 35.9727 17.8614 36 17.9999 36C18.1384 36 18.2756 35.9727 18.4036 35.9197C18.5315 35.8667 18.6478 35.789 18.7457 35.691L22.9556 31.4812H32.1211C34.26 31.4812 36.0001 29.7411 36.0001 27.6023V3.87886C36 1.74002 34.2599 0 32.121 0ZM33.8906 27.6023C33.8906 28.578 33.0968 29.3719 32.121 29.3719H22.5187C22.2389 29.3719 21.9707 29.4829 21.773 29.6808L17.9999 33.4538L14.227 29.6808C14.1291 29.5829 14.0128 29.5052 13.8849 29.4521C13.7569 29.3991 13.6197 29.3719 13.4812 29.3719H3.87893C2.9032 29.3719 2.10938 28.578 2.10938 27.6023V3.87886C2.10938 2.90313 2.9032 2.10938 3.87893 2.10938H32.1211C33.0968 2.10938 33.8906 2.90313 33.8906 3.87886V27.6023Z"
                                    fill="#405FF2"
                                    stroke="white"
                                    strokeWidth="0.7"
                                  />
                                </svg>
                              </div>
                              <div className="content-overview">
                                <h5>Sold</h5>
                                <div className="tfcl-dashboard-title">
                                  <span>
                                    <b>{loading ? "-" : soldCount}</b>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="tfcl-dashboard-middle mt-2">
                      <div className="row">
                        <div className="tfcl-dashboard-middle-left col-md-12">
                          <div className="tfcl-dashboard-listing">
                            <h5 className="title-dashboard-table">
                              Your listings
                            </h5>
                            {loading && <p>Loading your listings...</p>}
                            {error && <div className="alert alert-danger">{error}</div>}
                            {!loading && !error && (
                              <DashboardListingsTable
                                initialListings={listings}
                                showFilters
                              />
                            )}
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
