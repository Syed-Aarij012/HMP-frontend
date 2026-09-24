import Link from "next/link";
import Image from "@/components/common/AppImage";
import { home05Agents } from "@/data/agents";

function AboutTeam() {
  const featuredAgents = home05Agents.slice(0, 4);
  return (
    <>
      <section className="tf-section tf-about-team">
        <div className="container">
          <div className="row">
            <div className="col-lg-5">
              <div className="heading-section">
                <Image
                  className="ls-is-cached lazyloaded"
                  data-src="/assets/images/WhatsApp_Image_2026-09-14_at_3.32.30_PM-removebg-preview.png"
                  src="/assets/images/WhatsApp_Image_2026-09-14_at_3.32.30_PM-removebg-preview.png"
                  alt="HMP"
                  width={100}
                  height={50}
                />
                <h2 className="heading-tittle fw-7">
                  Meet our best consultants, who will help you find your dream
                  car
                </h2>
                <p className="fs-16 fw-4 text-color-2">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Suspendisse sit amet auctor dolor, quis gravida purus. Aliquam
                  gravida ipsum quis.
                </p>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="flex-three team-wrap-sec">
                <div className="grid-2 gap-48">
                  {featuredAgents.map((agent) => (
                    <div className="agent-item style2" key={agent.id}>
                      <div className="image">
                        <Link
                          href={`/sale-agents-detail/${agent.id}`}
                          className="d-block w-100"
                        >
                          <Image
                            className="lazyload w-100 img-fluid"
                            data-src={agent.image}
                            src={agent.image}
                            alt={agent.name}
                            width={675}
                            height={472}
                          />
                        </Link>
                        <ul className="social">
                          <li>
                            <a
                              href="https://www.facebook.com/"
                              className="icon-carus-facebook"
                            />
                          </li>
                          <li>
                            <a
                              href="https://www.linkedin.com/"
                              className="icon-carus-in"
                            />
                          </li>
                          <li>
                            <a href="https://x.com/" className="icon-carus-x" />
                          </li>
                        </ul>
                      </div>
                      <div className="content">
                        <div className="fs-18 fw-6 title text-color-2">
                          <Link href={`/sale-agents-detail/${agent.id}`}>
                            {agent.name}
                          </Link>
                        </div>
                        <p className="sub-title fs-12 fw-4">{agent.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href={`/sale-agents`} className="btn-join">
                  <span>Join our team</span>
                  <i className=" icon-carus-arright" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default AboutTeam;
