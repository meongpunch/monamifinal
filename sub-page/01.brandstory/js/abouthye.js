document.addEventListener('click', function (e) {
  const link = e.target.closest('a[href="#"]');
  if (!link) return;
  e.preventDefault();
})

window.addEventListener("load", function () {

  // GSAP 플러그인 등록
  gsap.registerPlugin(ScrollTrigger);


  


// 1. intro-숫자 슬롯머신
(() => {
  const startYear = 1960;
  const endYear = 2025;
  const yearEl = document.querySelector(".intro .main-text");
  const nextSection = document.querySelector(".sec1");

  if (!yearEl) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timing = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  let currentYear = startYear;
  const cols = [];

  function pad4(n) { return String(n).padStart(4, "0"); }

  function buildTrack(track) {
    for (let i = 0; i <= 10; i++) {
      const d = document.createElement("span");
      d.className = "year-digit";
      d.textContent = String(i % 10);
      d.style.display = "block";
      d.style.height = "1em";
      d.style.lineHeight = "1em";
      track.appendChild(d);
    }
  }

  function setTrackPx(track, px, animate, duration = 0, delay = 0) {
    if (!animate) {
      track.style.transition = "none";
    } else {
      track.style.transition = `transform ${duration}ms ${timing} ${delay}ms`;
    }
    track.style.transform = `translateY(${px}px)`;
  }

  function setupSlots(initialYear) {
    const s = pad4(initialYear);
    yearEl.textContent = "";
    yearEl.style.display = "inline-flex";
    yearEl.style.alignItems = "baseline";
    yearEl.style.gap = "0";
    yearEl.style.whiteSpace = "nowrap";

    for (let i = 0; i < 4; i++) {
      const col = document.createElement("span");
      col.className = "year-slot";
      col.style.display = "inline-block";
      col.style.position = "relative";
      col.style.overflow = "hidden";
      col.style.height = "1em";
      col.style.lineHeight = "1em";
      col.style.verticalAlign = "baseline";

      const track = document.createElement("span");
      track.className = "year-track";
      track.style.display = "block";
      track.style.willChange = "transform";

      buildTrack(track);
      col.appendChild(track);
      yearEl.appendChild(col);

      cols.push({ col, track, digitHeight: 0, curDigit: Number(s[i]) });
    }

    requestAnimationFrame(() => {
      cols.forEach((c) => {
        c.digitHeight = c.col.getBoundingClientRect().height || 1;
        setTrackPx(c.track, -c.curDigit * c.digitHeight, false);
      });
    });
  }

  function getStepDurationMs(nextYear) {
    if (nextYear <= 1972) return 150;
    if (nextYear <= 2018) return 26;
    if (nextYear <= 2022) return 100;
    return 260;
  }

  function animateStep(nextYear, done) {
    const curStr = pad4(currentYear);
    const nextStr = pad4(nextYear);
    const baseDuration = getStepDurationMs(nextYear);
    let maxEndTime = 0;

    for (let i = 0; i < 4; i++) {
      const c = cols[i];
      const curD = Number(curStr[i]);
      const nextD = Number(nextStr[i]);
      if (curD === nextD) continue;
      if (!c.digitHeight) c.digitHeight = c.col.getBoundingClientRect().height || 1;

      const delay = (3 - i) * 15;
      const isWrap = curD === 9 && nextD === 0;

      if (isWrap) {
        setTrackPx(c.track, -10 * c.digitHeight, true, baseDuration, delay);
        const endTime = baseDuration + delay;
        maxEndTime = Math.max(maxEndTime, endTime);
        setTimeout(() => {
          setTrackPx(c.track, 0, false);
          c.curDigit = 0;
        }, endTime + 5);
      } else {
        setTrackPx(c.track, -nextD * c.digitHeight, true, baseDuration, delay);
        maxEndTime = Math.max(maxEndTime, baseDuration + delay);
        c.curDigit = nextD;
      }
    }
    if (maxEndTime === 0) { done && done(); return; }
    setTimeout(() => { done && done(); }, maxEndTime + 16);
  }

 function play() {
  currentYear = startYear;

  const tick = () => {
    if (currentYear >= endYear) {

      return;
    }

    const nextYear = currentYear + 1;
    animateStep(nextYear, () => {
      currentYear = nextYear;
      tick();
    });
  };

  tick();
}


setupSlots(startYear);
setTimeout(play, 500);
})();


/* 🔒 LEFT 고정 (반응형 분기) */
ScrollTrigger.matchMedia({

  // 🖥 PC
  "(min-width: 1025px)": function () {
    ScrollTrigger.create({
      trigger: ".history-wrap",
      start: "top top",
      endTrigger: ".right-box",
      end: "bottom bottom",
      pin: ".left-pin",
      pinSpacing: true,
    });
  },

});


/* 🔁 스크롤에 따라 연도 교체 (반응형 분기) */
var groups = document.querySelectorAll(".history-group");

ScrollTrigger.matchMedia({

  // 🖥 PC (1025px 이상)
  "(min-width: 1025px)": function () {
    groups.forEach(function (group) {
      ScrollTrigger.create({
        trigger: group,
        start: "top center",
        end: "bottom center",
        onEnter: () => updateLeft(group),
        onEnterBack: () => updateLeft(group)
      });
    });
  },

  // 📱 1024px 이하
  "(max-width: 1024px)": function () {
    groups.forEach(function (group) {
      ScrollTrigger.create({
        trigger: group,
        start: "top 75%",   // ⭐ 여기 핵심
        end: "bottom 25%",
        onEnter: () => updateLeft(group),
        onEnterBack: () => updateLeft(group)
      });
    });
  }

});


  function updateLeft(group) {
    var date = group.dataset.date || "";
    var title = group.dataset.title || "";
    var img = group.dataset.img || "";

    gsap.to("#fixed-date", {
      opacity: 0,
      y: 10,
      duration: 0.25,
      onComplete: function () {
        document.querySelector("#fixed-date").innerHTML =
          String(date).replace("-", "<span></span>");
        gsap.to("#fixed-date", { opacity: 1, y: 0, duration: 0.25 });
      }
    });

    gsap.to("#fixed-title", {
      opacity: 0,
      y: 10,
      duration: 0.25,
      onComplete: function () {
        document.querySelector("#fixed-title").innerText = title;
        gsap.to("#fixed-title", { opacity: 1, y: 0, duration: 0.25 });
      }
    });

    gsap.to("#fixed-img", {
      opacity: 0,
      duration: 0.3,
      onComplete: function () {
        document.querySelector("#fixed-img").src = img;
        gsap.to("#fixed-img", { opacity: 1, duration: 0.3 });
      }
    });
  }


        //    gsap.fromTo('.sec1 .mask h2', {
        //     'background-size' : '0% 100%'
        // }, {
        //     'background-size' : '100% 100%',
        //     scrollTrigger: {
        //         trigger: '.sec1',
        //         start: 'top bottom',
        //         end: '0% 70%',
		// 					markers: true,
        //         scrub: 1
        //     }
        // });

        gsap.fromTo('.sec1 .mask h2 .line',
  { backgroundSize: '0% 100%' },
  {
    backgroundSize: '100% 100%',
    ease: 'none',
    stagger: 0.5,   // ⭐ 한 줄씩
    scrollTrigger: {
      trigger: '.sec1',
      start: 'top 70%',
      end: '+=400',
      scrub: 1,
      //markers: true
    }
  }
);

        gsap.fromTo('.sec4 .mask h2 .line',
  { backgroundSize: '0% 100%' },
  {
    backgroundSize: '100% 100%',
    ease: 'none',
    stagger: 0.5,   // ⭐ 한 줄씩
    scrollTrigger: {
      trigger: '.sec4',
      start: 'top 40%',
      end: '+=400',
      scrub: 1,
      //markers: true
    }
  }
);

        gsap.fromTo('.msg-intro .mask h2 .line',
  { backgroundSize: '0% 100%' },
  {
    backgroundSize: '100% 100%',
    ease: 'none',
    stagger: 0.5,   // ⭐ 한 줄씩
    scrollTrigger: {
      trigger: '.msg-intro',
      start: 'top 40%',
      end: '+=400',
      scrub: 1,
      //markers: true
    }
  }
);


/* =========================
   HEADER SHOW / HIDE + SPACE
========================= */

const header = document.querySelector("header");
const body = document.body;

if (header) {
  header.classList.add("active");

  ScrollTrigger.create({
    start: "top top",
    end: "max",
    onUpdate: (self) => {
      if (self.direction === 1) {
        // 스크롤 ↓
        header.classList.add("up");
        body.classList.add("header-hidden"); // ⭐ 공간 유지
      } else {
        // 스크롤 ↑
        header.classList.remove("up");
        body.classList.remove("header-hidden");
      }
    }
  });
}

/* =========================
   HISTORY 구간 감지
========================= */
ScrollTrigger.create({
  trigger: ".history-wrap",
  start: "top bottom",
  end: "bottom top",
  onEnter: () => document.body.classList.add("in-history"),
  onEnterBack: () => document.body.classList.add("in-history"),
  onLeave: () => document.body.classList.remove("in-history"),
  onLeaveBack: () => document.body.classList.remove("in-history"),
});
/* 메뉴 열기/닫기 */
const menuBtn = document.querySelector('.menu'); 
const menuOpen = document.querySelector('.menuOpen'); 
const closeBtn = document.querySelector('.closeBtn'); 

menuBtn?.addEventListener('click', () => {
  menuOpen?.classList.add('on');
});

closeBtn?.addEventListener('click', () => {
  menuOpen?.classList.remove('on');
});

});




