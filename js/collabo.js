 // === 1. Three.js 동글뱅이 효과 스크립트 ===
        const vertexShader = `
            varying vec2 v_texcoord;
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                v_texcoord = uv;
            }
        `;

        const fragmentShader = `
            varying vec2 v_texcoord;
            uniform vec2 u_mouse;
            uniform vec2 u_resolution;
            uniform float u_pixelRatio;
            uniform float u_accumulatedTime;
            uniform float u_elapsedTime;
            uniform float u_hoverState; 
            uniform float u_shapeSize;
            uniform float u_borderSize;
            uniform float u_blurStrength; 

            #ifndef PI
            #define PI 3.1415926535897932384626433832795
            #endif

            vec3 hash33(vec3 p3) {
                p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
                p3 += dot(p3, p3.yxz + 19.19);
                return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
            }

            float snoise3(vec3 p) {
                const float K1 = 0.333333333;
                const float K2 = 0.166666667;
                vec3 i = floor(p + (p.x + p.y + p.z) * K1);
                vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
                vec3 e = step(vec3(0.0), d0 - d0.yzx);
                vec3 i1 = e * (1.0 - e.zxy);
                vec3 i2 = 1.0 - e.zxy * (1.0 - e);
                vec3 d1 = d0 - (i1 - K2);
                vec3 d2 = d0 - (i2 - K1);
                vec3 d3 = d0 - 0.5;
                vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
                vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
                return dot(vec4(31.316), n);
            }

            mat2 rotate2d(float _angle){
                return mat2(cos(_angle),-sin(_angle), sin(_angle),cos(_angle));
            }

            vec2 coord(in vec2 p) {
                p = p / u_resolution.xy;
                if (u_resolution.x > u_resolution.y) {
                    p.x *= u_resolution.x / u_resolution.y;
                    p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
                } else {
                    p.y *= u_resolution.y / u_resolution.x;
                    p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
                }
                p -= 0.5;
                p *= vec2(-1.0, 1.0);
                return p;
            }

            #define st0 coord(gl_FragCoord.xy)
            #define mx coord(u_mouse * u_pixelRatio)

            float sdCircle(in vec2 st, in vec2 center) {
                return length(st - center) * 2.0;
            }

            float strokeAA(float x, float size, float w, float edge) {
                float d = smoothstep(size - edge - w/2.0, size + edge - w/2.0, x + w * 0.5)
                        - smoothstep(size - edge - w/2.0, size + edge - w/2.0, x - w * 0.5);
                return clamp(d, 0.0, 1.0);
            }

            void main() {
                vec2 st = st0 + 0.5;
                vec2 mousePos = mx * vec2(1.0, -1.0) + 0.5;
                float distToMouse = length(st - mousePos);
                float spotlight = smoothstep(0.4, 0.0, distToMouse);
                float activeSpotlight = spotlight * u_hoverState;
                float noiseScale = 0.0;
                // 원모양 구불거리는 정도
                float noiseSpeed = u_elapsedTime * 0.5;
                vec2 noisySt = st;
                noisySt.x += snoise3(vec3(st * 3.0, noiseSpeed)) * noiseScale;
                noisySt.y += snoise3(vec3(st * 3.0, noiseSpeed + 10.0)) * noiseScale;
                float dynamicThick = u_borderSize * 0.15 + (u_borderSize * 4.0 * activeSpotlight);
                float dynamicGlow = 0.005 + (u_blurStrength * 4.0 * activeSpotlight); 
                float t = u_accumulatedTime;
                float size = u_shapeSize;
                float gap = 0.02;
                float combined = 0.0;
                
                // 5개의 선 그리기
                float speeds[5]; speeds[0]=-1.5; speeds[1]=-0.8; speeds[2]=1.6; speeds[3]=-0.6; speeds[4]=0.8;
                float gaps[5]; gaps[0]=0.0; gaps[1]=1.0; gaps[2]=2.0; gaps[3]=3.0; gaps[4]=4.0;
                
                for(int i=0; i<5; i++){
                    vec2 s_st = rotate2d(t * speeds[i]) * (noisySt - 0.5) + 0.5;
                    vec2 dist = (s_st - 0.5) / vec2(1.0 + float(i)*0.01, 0.97 - float(i)*0.01) + 0.5;
                    float d = sdCircle(dist, vec2(0.5));
                    combined += strokeAA(d, size + gap * gaps[i], dynamicThick * (1.0 + float(i)*0.1), dynamicGlow);
                }

                float brightness = 1.05 + (activeSpotlight * 1.0); 
                vec3 color = vec3(0.9, 0.95, 1.0); 
                gl_FragColor = vec4(color, combined * brightness);
            }
        `;

        class ShapeBlur {
            constructor(container) {
                this.container = container;
                this.accumulatedTime = 0;
                this.elapsedTime = 0;
                this.lastTime = performance.now();
                this.isHovering = false; 
                this.vMouse = new THREE.Vector2();
                this.vMouseDamp = new THREE.Vector2();
                this.vResolution = new THREE.Vector2();
                this.init();
            }
            init() {
                this.scene = new THREE.Scene();
                this.camera = new THREE.OrthographicCamera();
                this.camera.position.z = 1;
                this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                this.container.appendChild(this.renderer.domElement);
                const geometry = new THREE.PlaneGeometry(1, 1);
                this.material = new THREE.ShaderMaterial({
                    vertexShader, fragmentShader,
                    uniforms: {
                        u_accumulatedTime: { value: 0 }, u_elapsedTime: { value: 0 }, u_hoverState: { value: 0 },
                        u_mouse: { value: this.vMouseDamp }, u_resolution: { value: this.vResolution },
                        u_pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
                        u_shapeSize: { value: 0.5 }, u_borderSize: { value: 0.02 }, u_blurStrength: { value: 0.12 } 
                    },
                    transparent: true, blending: THREE.AdditiveBlending 
                });
                this.scene.add(new THREE.Mesh(geometry, this.material));
                this.resize();
                window.addEventListener('resize', () => this.resize());
                this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
                this.update();
            }
            resize() {
                this.width = this.container.clientWidth;
                this.height = this.container.clientHeight;
                const dpr = Math.min(window.devicePixelRatio, 2);
                this.renderer.setSize(this.width, this.height);
                this.renderer.setPixelRatio(dpr);
                this.material.uniforms.u_resolution.value.set(this.width, this.height).multiplyScalar(dpr);
                this.material.uniforms.u_pixelRatio.value = dpr;
                this.scene.children[0].scale.set(this.width, this.height, 1);
            }
            onMouseMove(e) {
                const rect = this.container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.vMouse.set(x, y);
                const dist = Math.sqrt(Math.pow(x - rect.width/2, 2) + Math.pow(y - rect.height/2, 2));
                const normalizedDist = dist / rect.height;
                const isOverShape = normalizedDist > 0.25 && normalizedDist < 0.55;
                if (isOverShape && !this.isHovering) {
                    this.isHovering = true; 
                    gsap.to(this.material.uniforms.u_hoverState, { value: 0.6, duration: 0.5, ease: "power2.out" });
                } else if (!isOverShape && this.isHovering) {
                    this.isHovering = false; 
                    gsap.to(this.material.uniforms.u_hoverState, { value: 0, duration: 0.5, ease: "power2.out" });
                }
            }
            update() {
                requestAnimationFrame(() => this.update());

                const now = performance.now();
                const delta = (now - this.lastTime) * 0.001; 
                this.lastTime = now;

                // [수정 전]
                // if (!this.isHovering) {
                //    this.accumulatedTime += delta * 0.6; 
                // }

                // [수정 후] 조건문 삭제 -> 항상 회전 시간이 흐름
                this.accumulatedTime += delta * 0.6; 

                // 물결용 시간 (기존 유지)
                this.elapsedTime += delta;

                this.material.uniforms.u_accumulatedTime.value = this.accumulatedTime;
                this.material.uniforms.u_elapsedTime.value = this.elapsedTime;

                this.vMouseDamp.x = THREE.MathUtils.damp(this.vMouseDamp.x, this.vMouse.x, 8, 0.016);
                this.vMouseDamp.y = THREE.MathUtils.damp(this.vMouseDamp.y, this.vMouse.y, 8, 0.016);

                this.renderer.render(this.scene, this.camera);
            }
        }

        // Three.js 실행
        const container = document.querySelector('.collabo01');
        if (container) new ShapeBlur(container);

/* ========================================= */
/* [COLLABO 02] Swiper JS (반응형 완벽 대응) */
/* ========================================= */
const collaboSwiper = new Swiper('.collabo', {
    // 1. CSS width 값을 따르도록 설정 (필수!)
    slidesPerView: 'auto', 
    
    // 2. 기본 간격
    spaceBetween: 24,       
    loop: true,             
    
    observer: true,
    observeParents: true,
    speed: 800,
    
    // 3. 반응형 Breakpoints (간격 제어)
    breakpoints: {
        // 모바일 (390px 포함)
        320: {
            spaceBetween: 24, // 요청하신 간격
            centeredSlides: false, // 왼쪽 정렬 (Offset은 CSS padding으로 처리)
        },
        // 태블릿 (768px 포함)
        768: {
            spaceBetween: 24, // 요청하신 간격
            centeredSlides: false,
        },
        // PC (1025px 이상)
        1025: {
            spaceBetween: 24, // 혹은 PC 디자인에 맞는 간격
            centeredSlides: false, // 혹은 true
        }
    }
});