// a 태그 기본 동작 방지 (전역)
document.addEventListener('click', function(e) {
  const link = e.target.closest('a[href="#"]');
  if (link) {
    e.preventDefault();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  
 /* =========================================
     [1] HEADER CONTROL (순수 JS로 변경 - 에러 방지)
     ========================================= */
  const headerController = () => {
    const header = document.querySelector("header");
    if (!header) return;

    let lastY = window.scrollY;

    const updateHeader = () => {
      const currentY = window.scrollY;

      // 1. 스크롤 방향 감지 (50px 이상 스크롤 시 동작)
      if (currentY > lastY && currentY > 50) {
        // 내릴 때: 클래스 'up' 추가 (CSS에서 translateY(-100%) 처리됨)
        header.classList.add("up");
      } else {
        // 올릴 때: 클래스 'up' 제거
        header.classList.remove("up");
      }

      lastY = currentY;
    };

    window.addEventListener("scroll", updateHeader, { passive: true });
  };
  headerController();
});

  /* =========================================
     [2] Hero Section (Scroll Interaction)
     ========================================= */
  const heroController = () => {
    const section = document.querySelector(".bottom-inner");
    const list = document.querySelector(".hero-right-box ul");
    const journalItems = [...document.querySelectorAll(".hero-right-box li")];
    const images = [...document.querySelectorAll(".hero-cards img")];

    if (!section || !list || journalItems.length === 0 || images.length === 0) return;

    const len = Math.min(journalItems.length, images.length);
    let index = 0;
    let locked = false;

    // Body Lock Utils
    const lockBody = () => document.body.classList.add("lock-scroll");
    const unlockBody = () => document.body.classList.remove("lock-scroll");

    // CSS Transform 값 가져오기
    const getTranslateY = (el) => {
      const tr = getComputedStyle(el).transform;
      if (tr === "none") return 0;
      return parseFloat(tr.split(",")[5]) || 0;
    };

    // 중앙 정렬 계산
    const snapToCenter = (i) => {
      const centerY = section.getBoundingClientRect().top + section.offsetHeight / 2;
      // journalItems[i]가 없을 경우 대비 안전장치
      if(!journalItems[i]) return;
      
      const itemRect = journalItems[i].getBoundingClientRect();
      const delta = centerY - (itemRect.top + itemRect.height / 2);
      list.style.transform = `translateY(${getTranslateY(list) + delta}px)`;
    };

    // 활성화 함수
    const setActive = (i) => {
      index = Math.max(0, Math.min(i, len - 1));
      
      journalItems.forEach((el, idx) => el.classList.toggle("active", idx === index));
      images.forEach((img, idx) => img.classList.toggle("active", idx === index));
      
      snapToCenter(index);
    };

    // 휠 이벤트
    section.addEventListener("wheel", (e) => {
      // 마지막 아이템이고 스크롤을 내릴 때 -> 잠금 해제하고 페이지 스크롤 허용
      if (index === len - 1 && e.deltaY > 0) {
        unlockBody();
        return; 
      }
      // 첫 번째 아이템이고 스크롤을 올릴 때 -> 잠금 해제하고 페이지 스크롤 허용
      if (index === 0 && e.deltaY < 0) {
        unlockBody();
        return;
      }

      e.preventDefault();
      if (locked) return;
      locked = true;

      if (e.deltaY > 0) setActive(index + 1);
      else if (e.deltaY < 0) setActive(index - 1);

      setTimeout(() => (locked = false), 500); // 딜레이 약간 여유 있게 수정
    }, { passive: false });

    // 초기 실행
    requestAnimationFrame(() => setActive(0));

    // IntersectionObserver (화면에 들어오면 스크롤 잠금)
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // 진입 시 스크롤 위치 보정 로직이 필요할 수 있음
        lockBody();
      } else {
        unlockBody();
      }
    }, { threshold: 0.6 });

    io.observe(section);
  };
  heroController();


  /* =========================================
     [3] Marquee / Swiper Logic
     ========================================= */
const marqueeController = () => {
  const marquee  = document.querySelector('.marquee');
  const viewport = document.querySelector('.marquee-viewport');
  const track    = document.querySelector('.marquee-list');

  if (!marquee || !viewport || !track) return;

  const mqMobile   = window.matchMedia('(max-width: 768px)');
  const mqHoverOff = window.matchMedia('(max-width: 1024px)');
  const originalHTML = track.innerHTML;

  let rafId = null;
  let pos = 0;
  let speed = 1.5;
  let isPaused = false;

  /* ===============================
     DESKTOP : AUTO MARQUEE
  =============================== */
  const loop = () => {
    if (!isPaused) pos -= speed;

    const half = track.scrollWidth / 2;
    if (pos <= -half) pos += half;

    track.style.transform = `translateX(${pos}px)`;
    rafId = requestAnimationFrame(loop);
  };

  const enableMarquee = () => {
    viewport.style.overflow = 'hidden';

    if (track.innerHTML === originalHTML) {
      track.innerHTML = originalHTML + originalHTML;
    }

    pos = 0;
    isPaused = false;
    track.style.transform = 'translateX(0)';

    if (!rafId) loop();
  };

  /* ===============================
     MOBILE : NATIVE HORIZONTAL SCROLL
     + GRAB DRAG
  =============================== */
  let isGrab = false;
  let grabStartX = 0;
  let grabStartLeft = 0;

  const bindGrabScroll = () => {
    if (viewport.dataset.grab === '1') return;
    viewport.dataset.grab = '1';

    viewport.addEventListener('mousedown', (e) => {
      if (!mqMobile.matches) return;
      isGrab = true;
      grabStartX = e.clientX;
      grabStartLeft = viewport.scrollLeft;
      viewport.classList.add('dragging');
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isGrab) return;
      const dx = e.clientX - grabStartX;
      viewport.scrollLeft = grabStartLeft - dx;
    });

    window.addEventListener('mouseup', () => {
      if (!isGrab) return;
      isGrab = false;
      viewport.classList.remove('dragging');
    });
  };

  const enableSwiper = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    track.innerHTML = originalHTML;
    track.style.transform = 'none';

    viewport.style.overflowX = 'auto';
    viewport.style.overflowY = 'hidden';
    viewport.style.webkitOverflowScrolling = 'touch';

    bindGrabScroll();
  };

  /* ===============================
     MODE SWITCH
  =============================== */
  const applyMode = () => {
    if (mqMobile.matches) enableSwiper();
    else enableMarquee();
  };

  applyMode();
  mqMobile.addEventListener('change', applyMode);

  /* ===============================
     HOVER PAUSE (DESKTOP)
  =============================== */
  marquee.addEventListener('mouseenter', () => {
    if (!mqMobile.matches && !mqHoverOff.matches) isPaused = true;
  });

  marquee.addEventListener('mouseleave', () => {
    if (!mqMobile.matches && !mqHoverOff.matches) isPaused = false;
  });
};

marqueeController();

  
  /* =========================================
     [4] Accordion Logic
     ========================================= */
  const accordionController = () => {
    const accordion = document.getElementById('productAccordion');
    if (!accordion) return;

    const items = accordion.querySelectorAll('.pa-item');

    const setActive = (targetItem) => {
      items.forEach(item => item.classList.remove('active'));
      targetItem.classList.add('active');
    };

    items.forEach(item => {
      item.addEventListener('mouseenter', () => setActive(item));
      const link = item.querySelector('a');
      if(link) link.addEventListener('focus', () => setActive(item));
    });

    accordion.addEventListener('mouseleave', () => setActive(items[0]));
  };
  accordionController();

   // =========================================
    // 5. 모바일 메뉴 (햄버거 버튼) - 최종 통합
    // =========================================
    const menuBtn = document.querySelector('.menu'); 
    const menuOpen = document.querySelector('.menuOpen'); 
    const closeBtn = document.querySelector('.closeBtn'); 

    // 안전 장치: 요소가 실제로 존재할 때만 이벤트 연결
    if (menuBtn && menuOpen && closeBtn) {
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault(); // a태그일 경우 튀는 것 방지
            menuOpen.classList.add('on');
        });

        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            menuOpen.classList.remove('on');
        });
    } else {
        console.warn("메뉴 관련 클래스(.menu, .menuOpen, .closeBtn)를 찾을 수 없습니다.");
    }





    // =========================================
    // 3. 텍스트 채우기 애니메이션
    // =========================================
    const titles = gsap.utils.toArray(".main-title");

    titles.forEach((title) => {
        const lines = title.querySelectorAll(".text-line, .text-line .break");
        const targets = lines.length > 0 ? lines : [title];

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: title,
                start: "top 100%",
                end: "top 10%",
                scrub: 1,
                markers: false // 실전에서는 끔
            }
        });

        targets.forEach((target, index) => {
            tl.to(target, { backgroundSize: "100% 100%", ease: "none", duration: 1 }, index * 0.5);
            
            const redSpan = target.querySelector(".red");
            if(redSpan) {
                tl.to(redSpan, { backgroundSize: "100% 100%", ease: "none", duration: 1 }, index * 0.5);
            }
        });

        const descBolds = title.parentElement.querySelectorAll(".desc b");
        if(descBolds.length > 0) {
            tl.to(descBolds, { backgroundSize: "100% 100%, 100% 100%", ease: "none", duration: 1 }); 
        }
    });

