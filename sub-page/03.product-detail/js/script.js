// 모든 리소스(이미지, 폰트, HTML)가 다 로드된 후 딱 한 번만 실행합니다.
window.addEventListener("load", function() {

    // =========================================
    // 0. GSAP 플러그인 등록 (통합)
    // =========================================
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && typeof MotionPathPlugin !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
    } else {
        console.error("GSAP 플러그인이 로드되지 않았습니다.");
        return; // GSAP 없으면 아래 코드 실행 안 함
    }


   // =========================================
    // 1. Swiper (최종_진짜_최종.js)
    // =========================================
    const swiper = new Swiper('.function .swiper', {
        // CSS에서 width를 calc()와 px로 강제 지정했으므로 'auto'가 필수입니다.
        slidesPerView: "auto",
        
        // 간격(Gap)도 CSS의 margin-right로 제어합니다. JS 간섭 차단.
        spaceBetween: 0, 
        
        centeredSlides: false, // 무조건 왼쪽 정렬 (Offset은 padding-left로 처리)
        loop: false,
        observer: true,
        observeParents: true,
    });

    // =========================================
    // 2. 모나미 펜 글씨 쓰기 애니메이션
    // =========================================
    const wordPath = document.querySelector("#wordPath");
    const dotPath = document.querySelector("#dotPath");
    
    if(wordPath && dotPath) {
        const length = wordPath.getTotalLength();

        gsap.set(wordPath, { strokeDasharray: length, strokeDashoffset: length });
        gsap.set(dotPath, { opacity: 0 });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".product_detail.e",
                start: "top top",
                end: "+=3000",
                pin: true,
                scrub: 1,
                invalidateOnRefresh: true // 화면 크기 변경 시 애니메이션 좌표 재계산 (필수)
            }
        });

        tl.to(wordPath, { strokeDashoffset: 0, duration: 10, ease: "none" })
          .to(".pen-image", {
              motionPath: {
                  path: "#wordPath",
                  align: "#wordPath",
                  alignOrigin: [0.1, 0.97],
                  autoRotate: false 
              },
              duration: 10,
              ease: "none"
          }, "<")
          .to(dotPath, { opacity: 1, duration: 1.5, ease: "power2.out" }, "-=1.5");
    }


    // =========================================
    // 3. 텍스트 채우기 애니메이션
    // =========================================
    const titles = gsap.utils.toArray(".main-title, .page-title");

    titles.forEach((title) => {
        const lines = title.querySelectorAll(".text-line");
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


    // =========================================
    // 4. 헤더 스크롤 반응 (jQuery 제거하고 통합)
    // =========================================
    const mainHeader = document.querySelector("header");
    if (mainHeader) {
        // (1) 헤더 배경 활성화 (테스트용)
        ScrollTrigger.create({
            start: "top -100px",
            onUpdate: (self) => {
                if (self.direction === 1) { // 내릴 때
                    mainHeader.classList.add("active");
                }
            },
            onLeaveBack: () => mainHeader.classList.remove("active")
        });

        // (2) 스크롤 방향에 따른 헤더 숨김/보임
        ScrollTrigger.create({
            start: "top top",
            end: "max",
            onUpdate: (self) => {
                if (mainHeader.classList.contains("active")) {
                    if (self.direction === 1) { // 스크롤 내릴 때 (숨김)
                        mainHeader.classList.add("up");
                    } else { // 스크롤 올릴 때 (보임)
                        mainHeader.classList.remove("up");
                    }
                }
            }
        });
    }


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

}); // window.load 끝