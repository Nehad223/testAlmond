import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function Navbar({ categories, active, setActive }) {
  return (
    <nav className="gn-navbar">
      <Swiper slidesPerView="auto" spaceBetween={25} dir="RTL">
        {categories.map((cat, index) => (
          <SwiperSlide key={index} style={{ width: "auto" }}>
            <h1
              className={`gn-nav-link ${active === index ? "active" : ""}`}
              onClick={() => setActive(index)}
            >
              {cat.name}
            </h1>
          </SwiperSlide>
        ))}
      </Swiper>
    </nav>
  );
}

