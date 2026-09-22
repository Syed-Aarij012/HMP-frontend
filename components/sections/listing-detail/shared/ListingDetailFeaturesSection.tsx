import FooterCollapseBlock from "@/components/common/FooterCollapseBlock";
import type { Car } from "@/types/cars";

function CheckIcon() {
  return (
    <svg
      width={17}
      height={17}
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 8.125C0 3.6375 3.6375 0 8.125 0C12.6125 0 16.25 3.6375 16.25 8.125C16.25 12.6125 12.6125 16.25 8.125 16.25C3.6375 16.25 0 12.6125 0 8.125ZM11.1333 6.61333C11.1833 6.54671 11.2195 6.47076 11.2397 6.38996C11.26 6.30915 11.2638 6.22512 11.2511 6.1428C11.2384 6.06047 11.2094 5.98152 11.1657 5.91058C11.1221 5.83964 11.0646 5.77815 10.9969 5.72971C10.9291 5.68127 10.8523 5.64687 10.7711 5.62852C10.6898 5.61018 10.6057 5.60826 10.5237 5.62289C10.4417 5.63751 10.3635 5.66838 10.2936 5.71368C10.2237 5.75898 10.1635 5.81779 10.1167 5.88667L7.42 9.66167L6.06667 8.30833C5.94819 8.19793 5.79148 8.13783 5.62956 8.14069C5.46765 8.14354 5.31316 8.20914 5.19865 8.32365C5.08414 8.43816 5.01854 8.59265 5.01569 8.75456C5.01283 8.91648 5.07293 9.07319 5.18333 9.19167L7.05833 11.0667C7.12249 11.1308 7.19983 11.1802 7.28499 11.2114C7.37015 11.2426 7.46108 11.2549 7.55147 11.2474C7.64186 11.24 7.72955 11.213 7.80844 11.1682C7.88733 11.1235 7.95554 11.0621 8.00833 10.9883L11.1333 6.61333Z"
        fill="#405FF2"
      />
    </svg>
  );
}

type ListingDetailFeaturesSectionProps = {
  car: Car;
};

export default function ListingDetailFeaturesSection({
  car,
}: ListingDetailFeaturesSectionProps) {
  const features = car.filterFeatures ?? [];

  return (
    <>
      <div className="listing-line " />
      <FooterCollapseBlock
        className="listing-features"
        desktopHeadingClassName="footer-heading-desktop tfcl-listing-header"
        mobileHeadingClassName="footer-heading-mobie listing-details-mobie mb-30"
        contentClassName="features-inner tf-collapse-content"
        desktopHeading={<h2>Features</h2>}
        mobileHeading={<h2>Features</h2>}
      >
        {features.length > 0 ? (
          <div className="inner">
            {features.map((feature) => (
              <div className="listing-feature-wrap flex" key={feature}>
                <CheckIcon />
                <p>{feature}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No additional features listed for this vehicle yet.</p>
        )}
      </FooterCollapseBlock>
    </>
  );
}
