
//a 위로 안가게 하는
$(document).on('click', 'a[href="#"]', function(e){
e.preventDefault();
});


// GSAP 플러그인 등록
gsap.registerPlugin(ScrollTrigger);

$(function () {
  const $header = $('header');
  const $banner = $('.banner');         // 첫 섹션
  const $subNav = $('.anotherHeader');  // 두번째 헤더(아래 섹션용)

  function updateHeader() {
    const bannerEnd = $banner.offset().top + $banner.outerHeight();
    const sc = $(window).scrollTop();

    if (sc < bannerEnd) {
      // ✅ 첫 섹션 안: 메인 header 보이고, anotherHeader 숨김
      $header.addClass('active').removeClass('hide');
      $subNav.removeClass('scrolled');
    } else {
      // ✅ 첫 섹션 밖: 메인 header 숨김, anotherHeader 보임
      $header.removeClass('active').addClass('hide');
      $subNav.addClass('scrolled');
    }
  }

  $(window).on('scroll resize', updateHeader);
  updateHeader(); // 초기 1회 실행
});
// ================================
// PREMIUM ACCORDION + SLIDER
// 1300↑ : hover 아코디언
// 1300↓ : 클릭
// 850↓  : 1장 슬라이더 + 스와이프 + hover 이미지 고정
// ================================
$(function () {
  const $viewport = $('.premium-viewport'); // ✅ 추가
  const $track = $('.premium-accordion'); // ul
  const $items = $track.find('.acc-item');
  const $pager = $('.premium-pagination');

  if (!$items.length) return;

  const BP_CLICK = 1300;
  const BP_SLIDE = 850;
  let index = 0;

  // ---------- 모바일(850↓) hover 이미지 고정 ----------
  function applyMobileHoverLook() {
    if (window.innerWidth > BP_SLIDE) return;
    $items.each(function () {
      const $img = $(this).find('img');
      $img.attr('src', $img.data('hover'));
    });
  }

  // ---------- active 상태 ----------
  function setActive(idx) {
    index = Math.max(0, Math.min(idx, $items.length - 1));

    if (window.innerWidth <= BP_SLIDE) {
      $items.removeClass('active');
      $items.eq(index).addClass('active');
      applyMobileHoverLook();
    } else {
      $items.removeClass('active').each(function () {
        const $img = $(this).find('img');
        $img.attr('src', $img.data('default'));
      });

      const $cur = $items.eq(index);
      $cur.addClass('active');
      $cur.find('img').attr('src', $cur.find('img').data('hover'));
    }

    // pagination
    if ($pager.length) {
      $pager.find('.dot').removeClass('is-active')
        .eq(index).addClass('is-active');
    }
  }

  // ---------- 슬라이드 이동 ----------
function moveTrack() {
  if (window.innerWidth <= BP_SLIDE) {
    const cardW = $items.eq(0).outerWidth();
    const gap = parseFloat($track.css('gap')) || 0;
    const step = cardW + gap;   // ✅ 카드 + 카드 간격
    $track.css('transform', `translateX(-${index * step}px)`);
  } else {
    $track.css('transform', '');
  }
}

  function go(idx) {
    setActive(idx);
    moveTrack();
  }

  // ---------- pagination 생성 ----------
  if ($pager.length) {
    $pager.empty();
    $items.each(function () {
      $pager.append('<button type="button" class="dot"></button>');
    });

    $pager.on('click', '.dot', function () {
      go($(this).index());
    });
  }

  // ---------- PC hover ----------
  $items.on('mouseenter focusin', function () {
    if (window.innerWidth <= BP_CLICK) return;
    go($(this).index());
  });

  // ---------- tablet / mobile click ----------
  $items.on('click', function (e) {
    if (window.innerWidth > BP_CLICK) return;
    e.preventDefault();
    go($(this).index());
  });

// ---------- swipe (850↓) ----------
if ($viewport.length) {
  const el = $viewport.get(0);

  let startX = 0, startY = 0, lastX = 0;
  let dragging = false;
  const TH = 40;

  el.addEventListener('pointerdown', (e) => {
    if (window.innerWidth > BP_SLIDE) return;

    dragging = true;
    startX = lastX = e.clientX;
    startY = e.clientY;

    e.preventDefault(); // ⭐ 핵심
    el.setPointerCapture?.(e.pointerId);

    console.log('DOWN');
  }, { passive: false });

  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
    }

    lastX = e.clientX;
    console.log('MOVE');
  }, { passive: false });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;

    const diff = lastX - startX;
    if (diff > TH) go(index - 1);
    else if (diff < -TH) go(index + 1);

    console.log('UP');
  };

  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
}
  // ---------- resize ----------
  $(window).on('resize', function () {
    applyMobileHoverLook();
    setActive(index);
    moveTrack();
  });

  // ---------- init ----------
  go(0);
});



//롭다 슬라이더 (버튼 + 모바일 스와이프 + PC 드래그)
$(function () {
  const $slider = $('.LOBDA .lobda-slider');
  if (!$slider.length) return;

  const $viewport = $slider.find('.lobda-viewport');
  const $track = $slider.find('.list');
  const $items = $slider.find('li');
  const $prev = $slider.find('.lobda-arrow.prev');
  const $next = $slider.find('.lobda-arrow.next');

  let index = 0;

  const getGap = () => parseFloat($track.css('gap')) || 0;

  const getStep = () => $items.eq(0).outerWidth() + getGap();

  const getVisible = () => {
    const vw = $viewport.width();
    const itemW = $items.eq(0).outerWidth();
    const gap = getGap();
    const one = itemW + gap;
    return Math.max(1, Math.round((vw + gap) / one));
  };

  const clampIndex = () => {
    const visible = getVisible();
    const maxIndex = Math.max(0, $items.length - visible);
    index = Math.max(0, Math.min(index, maxIndex));
    return maxIndex;
  };

  const render = () => {
    const maxIndex = clampIndex();
    const x = index * getStep();
    $track.css('transform', `translateX(-${x}px)`);

    // 버튼 상태
    const prevDisabled = index === 0;
    const nextDisabled = index === maxIndex;

    $prev.prop('disabled', prevDisabled)
      .css({ opacity: prevDisabled ? 0.3 : 1, pointerEvents: prevDisabled ? 'none' : 'auto' });
    $next.prop('disabled', nextDisabled)
      .css({ opacity: nextDisabled ? 0.3 : 1, pointerEvents: nextDisabled ? 'none' : 'auto' });
  };

  // 데스크탑 버튼
  $prev.on('click', () => { index -= 1; render(); });
  $next.on('click', () => { index += 1; render(); });
  $(window).on('resize', render);

  /* ===== 스와이프/드래그 (Pointer Events) ===== */
  const vp = $viewport.get(0);
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let dragging = false;

  const THRESHOLD = 50; // 감도

  vp.addEventListener('pointerdown', (e) => {
    // 768 이하에서만 스와이프 동작
    if (window.innerWidth > 768) return;

    dragging = true;
    startX = lastX = e.clientX;
    startY = e.clientY;

    // 드래그 중 텍스트 선택 방지 + 포인터 캡처
    vp.setPointerCapture?.(e.pointerId);
  });

  vp.addEventListener('pointermove', (e) => {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // 가로가 더 크면 "가로 스와이프"로 판단 → 스크롤 방지
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
    }

    lastX = e.clientX;
  }, { passive: false });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;

    const diff = lastX - startX;

    if (diff > THRESHOLD) index -= 1;       // 오른쪽 드래그 => 이전
    else if (diff < -THRESHOLD) index += 1; // 왼쪽 드래그 => 다음

    render();
  };

  vp.addEventListener('pointerup', endDrag);
  vp.addEventListener('pointercancel', endDrag);
  /* ===== 끝 ===== */

  render();
});




// //롭다 슬라이더
// $(function(){
//   const $slider =$('.LOBDA .lobda-slider');
//   if (!$slider.length) return;

//   const $viewport = $slider.find('.lobda-viewport');
//   const $track = $slider.find('.list');
//   const $items = $slider.find('li');
//   const $prev = $slider.find('.lobda-arrow.prev');
//   const $next = $slider.find('.lobda-arrow.next');
  
//   let index = 0;

//   const getGap = () => {
//     const gapStr = $track.css('gap') || '0px';
//     const gap = parseFloat(gapStr)
//     return isNaN(gap) ? 0 : gap;
//   };

//   const getStep = () => {
//     const itemW = $items.eq(0).outerWidth();
//     return itemW + getGap();
//   };

//   const getVisible = () => {
//     const vw = $viewport.width();
//     const itemW = $items.eq(0).outerWidth();
//     const gap = getGap();
//     const one = itemW + gap;
//     return Math.max(1, Math.round((vw + gap) / one));
//   };

//   const clampIndex = () => {
//     const visible =getVisible();
//     const maxIndex = Math.max(0, $items.length - visible);
//     index = Math.max(0, Math.min(index, maxIndex));
//     return maxIndex;
//   };

//   const render = () => {
//     const maxIndex = clampIndex();
//     const x = index * getStep();
//     $track.css('transform',`translateX(-${x}px)`);


//     //버튼 마지막 화살표 비활성화
//     const prevDisabled = index === 0;
//     const nextDisabled = index === maxIndex;

//     $prev.prop('disabled', prevDisabled)
//           .css({ opacity: prevDisabled ? 0.3 : 1, pointerEvents: prevDisabled ? 'none' : 'auto' });
//     $next.prop('disabled', nextDisabled)
//           .css({ opacity: nextDisabled ? 0.3 : 1, pointerEvents: nextDisabled ? 'none' : 'auto' });
//     };

//   $prev.on('click', function () {
//     index -= 1;
//     render();
//   });
//   $next.on('click', function () {
//     index += 1;
//     render();
//   });
//   $(window).on('resize', render);
//   render();
//   });





// ================================
// HEADER MENU (main header)
// ================================
$(function () {
  const menuBtn  = document.querySelector('header .menu');
  const menuOpen = document.querySelector('.menuOpen');
  const closeBtn = document.querySelector('.menuOpen .closeBtn');

  if (menuBtn && menuOpen) {
    menuBtn.addEventListener('click', function () {
      menuOpen.classList.add('on');
    });
  }

  if (closeBtn && menuOpen) {
    closeBtn.addEventListener('click', function () {
      menuOpen.classList.remove('on');
    });
  }
});


// ================================
// ANOTHER HEADER MENU (sub header)
// ================================
$(function () {
  const menuBtn  = document.querySelector('.anotherHeader .menu');
  const menuOpen = document.querySelector('.another-menuOpen');
  const closeBtn = document.querySelector('.another-menuOpen .closeBtn');

  if (menuBtn && menuOpen) {
    menuBtn.addEventListener('click', function () {
      menuOpen.classList.add('on');
    });
  }

  if (closeBtn && menuOpen) {
    closeBtn.addEventListener('click', function () {
      menuOpen.classList.remove('on');
    });
  }
});



  
//text mask
    //three-pens
    gsap.fromTo('.three-pens .main-title .mask .line',
      { backgroundSize: '0% 100%' },
  {
    backgroundSize: '100% 100%',
    ease: 'none',
    stagger: 0.5,   // ⭐ 한 줄씩
    scrollTrigger: {
      trigger: '.three-pens',
      start: '20% 60%',
      end: '+=500',
      scrub: 1,
      //markers: true
    }
  }
    );

//another
        gsap.fromTo('.another .main-title .mask .line',
      { backgroundSize: '0% 100%' },
  {
    backgroundSize: '100% 100%',
    ease: 'none',
    stagger: 0.5,   // ⭐ 한 줄씩
    scrollTrigger: {
      trigger: '.another',
      start: '-10% 60%',
      end: '+=400',
      scrub: 1,
      //markers: true
    }
  }
    );


    //LOBDA
        gsap.fromTo('.LOBDA .main-title .mask .line',
      { backgroundSize: '0% 100%' },
  {
    backgroundSize: '100% 100%',
    ease: 'none',
    stagger: 0.5,   // ⭐ 한 줄씩
    scrollTrigger: {
      trigger: '.LOBDA',
      start: '-28% 60%',
      end: '+=400',
      scrub: 1,
      //markers: true
    }
  }
    );


        //premium
        gsap.fromTo('.premium .main-title .mask .line',
      { backgroundSize: '0% 100%' },
  {
    backgroundSize: '100% 100%',
    ease: 'none',
    stagger: 0.5,   // ⭐ 한 줄씩
    scrollTrigger: {
      trigger: '.premium',
      start: '0% 60%',
      end: '+=400',
      scrub: 1,
      //markers: true
    }
  }
    );



    // scrolla animation
$(function() {
	$('.animate').scrolla({
		mobile: true, //모바일버전시 활성화
		once: false //스크롤시 딱 한번만 하고싶을땐 true
	});    
}); 

