document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------
    // Loading Screen Fade-out (500ms)
    // --------------------------------------------------------
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => { loader.style.display = 'none'; }, 600);
        }
    }, 1000);

    // --------------------------------------------------------
    // UI Elements and Standard Observers
    // --------------------------------------------------------
    const heroContent = document.querySelector('.hero-content');
    const navbar = document.querySelector('.navbar');

    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section-title, .about-text, .edu-item, .skill-category, .project-card, .exp-item').forEach(el => {
        el.classList.add('fade-in-up');
        observer.observe(el);
    });

    document.querySelectorAll('.project-card, .skill-category').forEach(card => {
        // Simple vanilla 3D tilt tracking + glow mapping
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Inner glowing dot
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            // Calculate tilt angle based on mouse distance from center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.transition = `transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s`;
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = `box-shadow 0.3s, border-color 0.3s`;
        });
    });

    const bttBtn = document.getElementById('btt-btn');
    if (bttBtn) {
        bttBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                bttBtn.classList.add('visible');
            } else {
                bttBtn.classList.remove('visible');
            }
        });
    }

    // --------------------------------------------------------
    // THREE.JS 3D Scene Initialization
    // --------------------------------------------------------
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050510'); // Reverted to cool deep space tone
    // Completely removed fog so background stars are 100% visible

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 42);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 200);
    pointLight.position.set(-20, 20, 50);
    scene.add(pointLight);

    // --------------------------------------------------------
    // Color Palette
    // --------------------------------------------------------
    const palette = [
        new THREE.Color('#ff003c'), // Neon Red
        new THREE.Color('#ff7b00'), // Vibrant Orange
        new THREE.Color('#b026ff'), // Electric Purple
        new THREE.Color('#8a2be2'), // Deep Violet
        new THREE.Color('#00ff55'), // Matrix Green
        new THREE.Color('#66fcf1'), // Cyan
        new THREE.Color('#ffe600')  // Bright Yellow
    ];

    const starPalette = [
        new THREE.Color('#ffffff'), // Cool White
        new THREE.Color('#e2f1fa'), // Light Blue
        new THREE.Color('#66fcf1'), // Cyan
        new THREE.Color('#ffab40')  // Single warm vibrant orange star variety
    ];

    // --------------------------------------------------------
    // Static Background Stars
    // --------------------------------------------------------
    const starCount = 900;
    // Small geometry for static stars
    const starGeo = new THREE.PlaneGeometry(0.3, 0.3);
    const starMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });

    const starInstanced = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const dummyStar = new THREE.Object3D();
    const starData = [];

    for (let i = 0; i < starCount; i++) {
        // Push stars deeper into the background so they aren't close to the user's camera
        const x = (Math.random() - 0.5) * 400;
        const y = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 150 - 100; // Negative Z shifts them deep backward

        dummyStar.position.set(x, y, z);

        // Small variable sizes
        const scaleX = (Math.random() * 1.5) + 0.5;
        const scaleY = scaleX; // keep them squared for classic stars
        dummyStar.scale.set(scaleX, scaleY, 1);

        // Random rotation for some variety
        const rotZ = Math.random() * Math.PI;
        dummyStar.rotation.set(0, 0, rotZ);

        dummyStar.updateMatrix();
        starInstanced.setMatrixAt(i, dummyStar.matrix);

        // Apply limited color palette
        const starColor = starPalette[Math.floor(Math.random() * starPalette.length)];
        starInstanced.setColorAt(i, starColor);

        starData.push({
            x: x,
            y: y,
            z: z,
            speed: Math.random() * 0.05 + 0.01,
            scaleX: scaleX,
            scaleY: scaleY,
            rotX: 0,
            rotY: 0,
            rotZ: rotZ
        });
    }
    scene.add(starInstanced);

    // --------------------------------------------------------
    // Globe: Outer Wireframe Grid Skeleton
    // --------------------------------------------------------
    const globeRadius = 18;
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 24, 24);
    const globeMaterial = new THREE.MeshBasicMaterial({
        color: 0x45a29e, // Reverted to cool teal
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    // TEMPORARY: User requested to preview the network completely standalone without the sphere
    // scene.add(globe);

    const neuralNet = new THREE.Group();
    const particleCount = 250; // Reverted complexity
    const maxConnectionDistance = 5.0; // Reverted connection distance
    const netRadius = 13;

    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const burstPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const radius = Math.cbrt(Math.random()) * netRadius;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        basePositions[i * 3] = x;
        basePositions[i * 3 + 1] = y;
        basePositions[i * 3 + 2] = z;

        burstPositions[i * 3] = x * (Math.random() * 3 + 2.5); // Explode outwards significantly
        burstPositions[i * 3 + 1] = y * (Math.random() * 3 + 2.5);
        burstPositions[i * 3 + 2] = z * (Math.random() * 3 + 2.5);

        const col = starPalette[Math.floor(Math.random() * starPalette.length)];
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointsMaterial = new THREE.PointsMaterial({
        size: 0.35,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
    });
    const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);
    neuralNet.add(pointsMesh);

    const linePositions = [];
    const lineColors = [];
    const lineMappings = []; // Store mappings to update lines dynamically

    for (let i = 0; i < particleCount; i++) {
        const v1 = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        for (let j = i + 1; j < particleCount; j++) {
            const v2 = new THREE.Vector3(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
            if (v1.distanceTo(v2) < maxConnectionDistance) {
                linePositions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
                lineColors.push(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
                lineColors.push(colors[j * 3], colors[j * 3 + 1], colors[j * 3 + 2]);

                // Save indices to interpolate line coordinates efficiently every frame
                lineMappings.push({
                    p1Index: i,
                    p2Index: j,
                    lineIndex: (linePositions.length / 3) - 2 // The starting vertex index of this line pair
                });
            }
        }
    }

    const linesGeometry = new THREE.BufferGeometry();
    const dynamicLinePositions = new Float32Array(linePositions);
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(dynamicLinePositions, 3));
    linesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    const linesMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    });
    const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
    neuralNet.add(linesMesh);

    const netHitboxGeometry = new THREE.SphereGeometry(netRadius, 32, 32);
    const netHitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const netHitbox = new THREE.Mesh(netHitboxGeometry, netHitboxMaterial);
    neuralNet.add(netHitbox);

    scene.add(neuralNet);

    // Initial scale bounce
    globe.scale.set(0.1, 0.1, 0.1);
    neuralNet.scale.set(0.1, 0.1, 0.1);

    gsap.to(globe.scale, { x: 1, y: 1, z: 1, duration: 2, ease: "back.out(1.2)" });
    gsap.to(neuralNet.scale, { x: 1, y: 1, z: 1, duration: 2.2, delay: 0.2, ease: "back.out(1.5)" });

    // Slide in subtitle after the title crashes in
    gsap.fromTo('.hero-subtitle',
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 2.0, delay: 1.5, ease: "expo.out" }
    );

    // --------------------------------------------------------
    // Escaping Name Letters Setup & Intro Crash Animation
    // --------------------------------------------------------
    const escapableLetters = [];
    document.querySelectorAll('.name-first, .name-last').forEach(el => {
        const text = el.textContent.trim();
        el.innerHTML = '';
        for (let i = 0; i < text.length; i++) {
            if (text[i] === ' ') {
                el.appendChild(document.createTextNode(' '));
                continue;
            }
            const span = document.createElement('span');
            span.className = 'escapable-letter';
            span.textContent = text[i];
            el.appendChild(span);
            escapableLetters.push({
                element: span,
                x: -window.innerWidth - 500, y: 0, // Start completely off-screen left
                targetX: 0, targetY: 0,
                rot: 0, targetRot: 0,
                physicsReady: false
            });
        }
    });

    // Animate them crashing in
    gsap.to(escapableLetters, {
        x: 0,
        duration: 1.8,
        stagger: 0.05,
        delay: 0.6, // Wait for loader
        ease: "back.out(1.5)", // Bouncy crash stop
        onComplete: function () {
            // FIX: Enable physics for ALL letters in the array
            escapableLetters.forEach(letter => letter.physicsReady = true);
        }
    });

    // --------------------------------------------------------
    // Interaction Variables & Event Listeners
    // --------------------------------------------------------
    let mouse = new THREE.Vector2(0, 0);
    let targetMouse = { x: 0, y: 0 };
    let scrollY = window.scrollY;
    const raycaster = new THREE.Raycaster();

    // Globe Dragging state
    let isDraggingGlobe = false;
    let isDraggingNet = false;
    let previousMousePosition = { x: 0, y: 0 };
    let globeVelocity = { x: 0, y: 0 };
    let netVelocity = { x: 0, y: 0 };
    const globeBaseSpeed = 0.001;

    // Neural Net specific variables
    let netSpeed = -0.0008;
    const netState = { pulseSpeed: 0, burstFactor: 0 };

    // Burst Animation Trigger (Double Click)
    window.addEventListener('dblclick', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const netIntersects = raycaster.intersectObject(netHitbox);
        // Burst the network if you click anywhere or specifically on the network
        // We'll let it burst universally on double-click for maximum impact

        gsap.killTweensOf(netState);

        // Hide connections initially during chaos 
        gsap.to(linesMaterial, { opacity: 0, duration: 0.1 });

        // Violent Burst Out
        gsap.to(netState, {
            burstFactor: 1,
            pulseSpeed: 0.1, // Extra fast rotation pulse
            duration: 0.8,
            ease: "expo.out",
            onComplete: () => {
                // Slowly beautifully reform into shape over 25 seconds
                gsap.to(netState, { burstFactor: 0, pulseSpeed: 0, duration: 25.0, ease: "power3.inOut" });
                gsap.to(linesMaterial, { opacity: 0.15, duration: 8.0, delay: 10.0, ease: "power2.in" });
            }
        });
    });

    // Device events mapping for pointer support (mouse/touch)
    window.addEventListener('pointerdown', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        // Check intersections against the inner globe and neural net
        const globeIntersects = raycaster.intersectObject(globe);
        const netIntersects = raycaster.intersectObject(netHitbox);

        if (netIntersects.length > 0) {
            isDraggingNet = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
            netVelocity = { x: 0, y: 0 };
            document.body.style.cursor = 'grabbing';
        } else if (globeIntersects.length > 0) {
            isDraggingGlobe = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
            globeVelocity = { x: 0, y: 0 };
            document.body.style.cursor = 'grabbing';
        }

        if (globeIntersects.length > 0 || netIntersects.length > 0) {
            gsap.killTweensOf(neuralNet.scale);
            gsap.fromTo(neuralNet.scale,
                { x: 1.35, y: 1.35, z: 1.35 },
                { x: 1, y: 1, z: 1, duration: 1.5, ease: "elastic.out(1, 0.3)" }
            );

            gsap.killTweensOf(globe.scale);
            gsap.fromTo(globe.scale,
                { x: 1.05, y: 1.05, z: 1.05 },
                { x: 1, y: 1, z: 1, duration: 1.0, ease: "bounce.out" }
            );

            netState.pulseSpeed = 0.02;
            gsap.to(netState, { pulseSpeed: 0, duration: 2.0, ease: "power2.out" }); // Extended duration for smoother slow-down
        }
    });

    window.addEventListener('pointermove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        targetMouse.x = mouse.x;
        targetMouse.y = mouse.y;

        if (isDraggingNet) {
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            neuralNet.rotation.y += deltaMove.x * 0.005;
            neuralNet.rotation.x += deltaMove.y * 0.005;

            netVelocity.x = deltaMove.x * 0.005;
            netVelocity.y = deltaMove.y * 0.005;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        } else if (isDraggingGlobe) {
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            globe.rotation.y += deltaMove.x * 0.005;
            globe.rotation.x += deltaMove.y * 0.005;

            globeVelocity.x = deltaMove.x * 0.005;
            globeVelocity.y = deltaMove.y * 0.005;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    });

    window.addEventListener('pointerup', () => {
        if (isDraggingGlobe || isDraggingNet) {
            isDraggingGlobe = false;
            isDraggingNet = false;
            document.body.style.cursor = 'default';
        }
    });

    // Fallback if they drag outside the window
    window.addEventListener('mouseleave', () => {
        if (isDraggingGlobe || isDraggingNet) {
            isDraggingGlobe = false;
            isDraggingNet = false;
            document.body.style.cursor = 'default';
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;

        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --------------------------------------------------------
    // Custom Trailing Cursor Logic
    // --------------------------------------------------------
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorGlow = document.querySelector('.cursor-glow');
    let cX = window.innerWidth / 2, cY = window.innerHeight / 2;
    let tX = cX, tY = cY;

    window.addEventListener('mousemove', (e) => {
        tX = e.clientX;
        tY = e.clientY;
        // The main dot follows instantly
        if (cursorDot) {
            cursorDot.style.left = `${tX}px`;
            cursorDot.style.top = `${tY}px`;
        }

        // Apply Escaping Letter Target Updates
        escapableLetters.forEach(letter => {
            const rect = letter.element.getBoundingClientRect();
            // Original un-transformed center
            const centerX = rect.left - letter.x + rect.width / 2;
            const centerY = rect.top - letter.y + rect.height / 2;

            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const maxDist = 80; // Activation radius
            if (dist < maxDist && dist > 0.1) {
                // Non-linear falloff for smoother push
                const force = Math.pow((maxDist - dist) / maxDist, 2.0);
                const dirX = dx / dist;
                const dirY = dy / dist;

                // Add a perpendicular tangent to make it swirl/circle around mouse
                const perpX = -dirY;
                const perpY = dirX;

                // --- UPDATED FOR SUBTLE MOVEMENT ---
                const swirlFactor = 0;   // Set to 0 to stop the letters from swirling around the cursor
                const pushFactor = 1.0;  // Push directly away from the cursor

                const moveAmt = force * 15; // Max displacement reduced drastically (from 100 to 15)

                letter.targetX = (-dirX * pushFactor + perpX * swirlFactor) * moveAmt;
                letter.targetY = (-dirY * pushFactor + perpY * swirlFactor) * moveAmt;

                // Subtle rotation dodge
                letter.targetRot = (-dirX) * force * 10; // Reduced rotation (from 45 to 10)
            } else {
                letter.targetX = 0;
                letter.targetY = 0;
                letter.targetRot = 0;
            }
        });
    });

    // Handle hover states for interactive elements
    document.querySelectorAll('a, button, .project-card, .skill-category').forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (!cursorDot || !cursorGlow) return;
            cursorDot.style.width = '0px';
            cursorDot.style.height = '0px';
            cursorGlow.style.width = '70px';
            cursorGlow.style.height = '70px';
            cursorGlow.style.background = 'radial-gradient(circle, rgba(255,152,0,0.3) 0%, rgba(255,152,0,0) 70%)';
            cursorGlow.style.border = '1px solid rgba(255,152,0,0.8)';
        });
        el.addEventListener('mouseleave', () => {
            if (!cursorDot || !cursorGlow) return;
            cursorDot.style.width = '8px';
            cursorDot.style.height = '8px';
            cursorGlow.style.width = '40px';
            cursorGlow.style.height = '40px';
            cursorGlow.style.background = 'radial-gradient(circle, rgba(255,152,0,0.15) 0%, rgba(255,152,0,0) 70%)';
            cursorGlow.style.border = '1px solid rgba(255,152,0,0.5)';
        });
    });

    // Smooth pursuit for the glow
    const animateCursor = () => {
        cX += (tX - cX) * 0.15;
        cY += (tY - cY) * 0.15;
        if (cursorGlow) {
            cursorGlow.style.left = `${cX}px`;
            cursorGlow.style.top = `${cY}px`;
        }
        requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // --------------------------------------------------------
    // Rendering Loop
    // --------------------------------------------------------
    let lastRenderTime = 0;

    const tick = (time) => {
        // 1. Inner Globe Rotation Logic (Drag vs Inertia vs Auto)
        if (!isDraggingGlobe) {
            // Apply inertia decay
            globe.rotation.y += globeVelocity.x;
            globe.rotation.x += globeVelocity.y;
            globeVelocity.x *= 0.95;
            globeVelocity.y *= 0.95;

            if (Math.abs(globeVelocity.x) < 0.002) {
                globe.rotation.y += globeBaseSpeed;
            }
        }

        // 2. Neural Net specifically handles spinning opposite and internal burst positioning
        // Becomes static in space during burst, slowly regaining spin as it reforms
        if (!isDraggingNet) {
            neuralNet.rotation.y += netVelocity.x;
            neuralNet.rotation.x += netVelocity.y;
            netVelocity.x *= 0.95;
            netVelocity.y *= 0.95;

            if (Math.abs(netVelocity.x) < 0.002) {
                neuralNet.rotation.y += (netSpeed - netState.pulseSpeed) * (1 - netState.burstFactor);
            }
        }

        if (netState.burstFactor > 0 || netState.pulseSpeed > 0) {
            // Lerp target positions radially outwards
            const positionsArr = pointsGeometry.attributes.position.array;
            const linePosArr = linesGeometry.attributes.position.array;

            for (let i = 0; i < particleCount; i++) {
                const bxF = basePositions[i * 3];
                const byF = basePositions[i * 3 + 1];
                const bzF = basePositions[i * 3 + 2];

                const exF = burstPositions[i * 3];
                const eyF = burstPositions[i * 3 + 1];
                const ezF = burstPositions[i * 3 + 2];

                positionsArr[i * 3] = bxF + (exF - bxF) * netState.burstFactor;
                positionsArr[i * 3 + 1] = byF + (eyF - byF) * netState.burstFactor;
                positionsArr[i * 3 + 2] = bzF + (ezF - bzF) * netState.burstFactor;
            }

            // Map new coordinates directly cleanly to line vertices using raw arrays
            for (let map of lineMappings) {
                const p1 = map.p1Index * 3;
                const p2 = map.p2Index * 3;
                const lStart = map.lineIndex * 3;

                // Point 1
                linePosArr[lStart] = positionsArr[p1];
                linePosArr[lStart + 1] = positionsArr[p1 + 1];
                linePosArr[lStart + 2] = positionsArr[p1 + 2];
                // Point 2
                linePosArr[lStart + 3] = positionsArr[p2];
                linePosArr[lStart + 4] = positionsArr[p2 + 1];
                linePosArr[lStart + 5] = positionsArr[p2 + 2];
            }

            pointsGeometry.attributes.position.needsUpdate = true;
            linesGeometry.attributes.position.needsUpdate = true;
        }

        // 3. Background Stars Animation (Static)
        for (let i = 0; i < starCount; i++) {
            const data = starData[i];

            // Apply position with heavy mouse parallax
            dummyStar.position.set(
                data.x + mouse.x * 15.0,
                data.y + mouse.y * 15.0,
                data.z
            );

            dummyStar.rotation.set(data.rotX, data.rotY, data.rotZ);
            dummyStar.scale.set(data.scaleX, data.scaleY, 1);

            dummyStar.updateMatrix();
            starInstanced.setMatrixAt(i, dummyStar.matrix);
        }
        starInstanced.instanceMatrix.needsUpdate = true;

        // 4. Camera Parallax Effects
        camera.position.x += (targetMouse.x * 3 - camera.position.x) * 0.05;
        camera.position.y += (targetMouse.y * 3 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        // 5. Scroll mechanics (Globe moves backward/downward and name fades)
        if (scrollY < 800) {
            const progress = scrollY / 400;
            gsap.set(heroContent, {
                y: -scrollY * 0.6,
                opacity: Math.max(0, 1 - progress)
            });

            // Fast descent so the sphere visually goes down and disappears off-screen quickly
            if (typeof globe !== 'undefined') globe.position.y = 3 - scrollY * 0.15;
            neuralNet.position.y = 3 - scrollY * 0.15;
            if (typeof globe !== 'undefined') globe.position.z = -scrollY * 0.01;
            neuralNet.position.z = -scrollY * 0.01;
        }

        // 6. Smooth Physics Lerp for Escaping Letters
        escapableLetters.forEach(letter => {
            if (letter.physicsReady) {
                letter.x += (letter.targetX - letter.x) * 0.15;
                letter.y += (letter.targetY - letter.y) * 0.15;
                letter.rot += (letter.targetRot - letter.rot) * 0.15;
            }

            if (Math.abs(letter.x) > 0.05 || Math.abs(letter.y) > 0.05 || Math.abs(letter.rot) > 0.05) {
                letter.element.style.transform = `translate(${letter.x}px, ${letter.y}px) rotate(${letter.rot}deg)`;
            } else if (letter.element.style.transform !== '') {
                letter.element.style.transform = '';
            }
        });

        renderer.render(scene, camera);
        window.requestAnimationFrame(tick);
    };

    tick(0);
    // --------------------------------------------------------
    // Resume Link: Scroll, Glow, and Tooltip Logic
    // --------------------------------------------------------
    const navResume = document.getElementById('nav-resume');
    const linkedinLink = document.getElementById('linkedin-link');
    const resumeTooltip = document.getElementById('resume-tooltip');

    if (navResume && linkedinLink && resumeTooltip) {
        navResume.addEventListener('click', (e) => {
            e.preventDefault(); // Stop default instant jump

            // 1. Smoothly scroll down to the footer
            linkedinLink.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // 2. Wait 800ms for the scroll to finish, then trigger animations
            setTimeout(() => {
                linkedinLink.classList.add('glow-active');
                resumeTooltip.classList.add('tooltip-active');

                // 3. Remove the tooltip and glow after 4 seconds
                setTimeout(() => {
                    linkedinLink.classList.remove('glow-active');
                    resumeTooltip.classList.remove('tooltip-active');
                }, 4000);
            }, 800);
        });
    }

});
