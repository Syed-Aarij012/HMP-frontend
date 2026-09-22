import Link from "next/link";
import Image from "@/components/common/AppImage";
import { saleAgents } from "@/data/agents";

function SaleAgents() {
  return (
    <>
      <section className="tf-section3">
        <div className="container">
          <div className="grid-4 gap-30 mb-50 sale-agent-wrap">
            {saleAgents.map((agent) => (
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
                      width={507}
                      height={354}
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
        </div>
      </section>
    </>
  );
}

export default SaleAgents;
