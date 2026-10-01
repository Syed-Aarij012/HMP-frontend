import Footer1 from "@/components/footers/Footer1";
import Header2 from "@/components/headers/Header2";
import { Metadata } from "next";
import Hero from "@/components/sections/home03/Hero";
import CarFilter from "@/components/sections/home03/CarFilter";
import FindCar from "@/components/sections/home04/FindCars";
import RecommendedCars from "@/components/sections/home03/RecommendedCars";
import PopularListings from "@/components/sections/index/PopularListings";
import LoanCalculator from "@/components/sections/index/LoanCalculator";
import WhyChooseUs from "@/components/sections/home03/WhyChooseUs";
import Banner from "@/components/sections/home03/Banner";
import PersonalizedRails from "@/components/sections/home03/PersonalizedRails";
import SearchByBrand from "@/components/sections/home02/SearchCar";
import Testimonials from "@/components/sections/home03/Testimonials";
import LatestNews from "@/components/sections/home03/LatestNews";
import OurPartners from "@/components/sections/home03/OurPartners";
export const metadata: Metadata = {
  title:
    "Home03 | HMP - Car Dealer, Rental & Listing",
  description: "HMP - Car Dealer, Rental & Listing",
};
export default function Home03Page() {
  return (
    <>
      {" "}
      <Header2 />
      <>
        <Hero />
        <CarFilter />
        <SearchByBrand />
        <Banner />
        <FindCar />
        <RecommendedCars />
        <PopularListings />
        <LoanCalculator />

        <section style={{ padding: 0 }}>
          <div className="container">
            <div className="line" />
          </div>
        </section>

        <WhyChooseUs />
        <div className="home03-add-top">
          <PersonalizedRails />
        </div>
        <Testimonials />
        <LatestNews />
        <OurPartners />
      </>
      <Footer1 />
    </>
  );
}
