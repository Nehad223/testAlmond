import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function Navbar({ categories = [], active = 0, setActive = () => {} }) {
  const onKey = (e, idx) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActive(idx);
    }
  };

  return (
    <nav className="gn-navbar" aria-label="الأقسام">
      <Swiper slidesPerView="auto" spaceBetween={25} dir="RTL">
        {categories.map((cat, index) => (
          <SwiperSlide key={cat.id || cat.name || index} style={{ width: "auto" }}>
            <button
              type="button"
              className={`gn-nav-link ${active === index ? "active" : ""}`}
              onClick={() => setActive(index)}
              onKeyDown={(e) => onKey(e, index)}
              aria-pressed={active === index}
            >
              {cat.name}
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </nav>
  );
}

