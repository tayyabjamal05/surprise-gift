import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
// Initialize Firebase via direct URL imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- FIREBASE CONFIGURATION & JOURNEY TRACKING ---
const firebaseConfig = {
    apiKey: "AIzaSyCyaE0UoW8PwQCmqqKTYV2a29Vm9ZHfaf0",
    authDomain: "surprisegift-web.firebaseapp.com",
    databaseURL: "https://surprisegift-web-default-rtdb.firebaseio.com",
    projectId: "surprisegift-web",
    storageBucket: "surprisegift-web.firebasestorage.app",
    messagingSenderId: "67625684138",
    appId: "1:67625684138:web:255e7d73d8fbbbb83994d3"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const journeyLogs = {};
let currentSection = 'home';
let sectionEnterTime = Date.now();

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const timeSpent = (Date.now() - sectionEnterTime) / 1000;
            if (!journeyLogs[currentSection]) journeyLogs[currentSection] = 0;
            journeyLogs[currentSection] += timeSpent;
            currentSection = entry.target.id;
            sectionEnterTime = Date.now();
        }
    });
}, { threshold: 0.5 });
document.querySelectorAll('.page-section').forEach(sec => observer.observe(sec));


// --- ORDER FORM LOGIC ---
const orderForm = document.getElementById('orderForm');
const formFeedback = document.getElementById('formFeedback');
const submitBtn = document.getElementById('submitBtn');

async function placeOrder(customerName, whatsapp, message, productName) {
    try {
        // A. Firebase Database mein data save karna (Record ke liye)
        const ordersRef = ref(db, 'orders');
        const newOrderRef = await push(ordersRef, {
            name: customerName,
            phone: whatsapp,
            note: message,
            product: productName,
            timestamp: new Date().toLocaleString()
        });

        // B. WhatsApp Prompt Configuration
        const myNumber = "923293163015"; 
        const orderId = newOrderRef.key; 
        const shortOrderId = orderId.substring(orderId.length - 4).toUpperCase();

        const header = "✨ *NEW ORDER RECEIVED - SURPRISE GIFT STORE* ✨";
        const footer = `\n\n---\n✅ *Status:* Confirmed\n🙏 *Thank you for purchasing from Surprise Gift Store!*\n_We will contact you shortly to finalize the details._`;

        const fullMessage = `${header}\n\n🆔 *Order ID:* #${shortOrderId} (Auto-generated)\n👤 *Customer Name:* ${customerName}\n📱 *WhatsApp:* ${whatsapp}\n🎁 *Product Selected:* ${productName}\n🎨 *Customization:* ${message || "Standard"}${footer}`;

        // WhatsApp Link Generator (Direct App on Mobile)
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const whatsappUrl = isMobileDevice 
            ? `whatsapp://send?phone=${myNumber}&text=${encodeURIComponent(fullMessage)}`
            : `https://wa.me/${myNumber}?text=${encodeURIComponent(fullMessage)}`;

        // C. Animation Trigger (Shatter Effect)
        if (typeof shatterBox === "function") {
            shatterBox(); 
        } else {
            gsap.to(state, { phase: 6, duration: 2.5, ease: "power3.inOut" });
        }

        // D. Redirect to WhatsApp (5 seconds delay for animation)
        setTimeout(() => {
            window.location.href = whatsappUrl;
        }, 5000);

        // Update UI
        orderForm.reset();
        formFeedback.classList.remove('hidden');
        submitBtn.innerText = "Order Sent!";

    } catch (e) {
        console.error("System Error:", e);
        alert("Something went wrong! Order floating away...");
        submitBtn.innerText = "Try Again";
        submitBtn.disabled = false;
    }
}

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.innerText = "Processing..."; submitBtn.disabled = true;

    // Journey tracking
    const timeSpent = (Date.now() - sectionEnterTime) / 1000;
    if (!journeyLogs[currentSection]) journeyLogs[currentSection] = 0;
    journeyLogs[currentSection] += timeSpent;

    // Get values matching the HTML IDs
    const customerName = document.getElementById('orderName').value;
    const whatsapp = document.getElementById('orderPhone').value;
    const message = document.getElementById('orderNote').value;
    const productSelect = document.getElementById('orderProduct');
    const productName = productSelect.options[productSelect.selectedIndex].text;

    // Call the new placeOrder function
    await placeOrder(customerName, whatsapp, message, productName);
});


// --- SCENE SETUP (WebGL & CSS3D) ---
const container = document.getElementById('canvas-container');
const cssContainer = document.getElementById('css-container');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// Push camera back on mobile
const isMobile = window.innerWidth < 768;
camera.position.set(0, 0, isMobile ? 25 : 16); // Consistent with resize handler
camera.lookAt(0, 0, 0);

// WebGL Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// CSS3D Renderer (For embedded social videos)
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0px';
cssContainer.appendChild(cssRenderer.domElement);

const parallaxGroup = new THREE.Group();
scene.add(parallaxGroup);

// --- LIGHTING ---
parallaxGroup.add(new THREE.AmbientLight(0xffffff, 1.5));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(5, 10, 15);
parallaxGroup.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
rimLight.position.set(-5, 5, -10);
parallaxGroup.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
fillLight.position.set(-5, 0, 10);
parallaxGroup.add(fillLight);


// --- LUXURY CYLINDER PARAMETERS (Finer Pattern) ---
const cylRadius = 1.8;
const cylHeight = 4.8;
const radialSegments = 24; // Increased from 16
const heightSegments = 12; // Increased from 8
const totalShards = radialSegments * heightSegments;
const shardHeight = cylHeight / heightSegments;
const shardAngle = (Math.PI * 2) / radialSegments;

// Create a Diamond Shape for Shards
const dShape = new THREE.Shape();
dShape.moveTo(0, shardHeight / 2);
dShape.lineTo(shardAngle * cylRadius / 2, 0);
dShape.lineTo(0, -shardHeight / 2);
dShape.lineTo(-shardAngle * cylRadius / 2, 0);
dShape.closePath();
const baseGeo = new THREE.ShapeGeometry(dShape);

// Luxury Glossy Ceramic Material
const shardMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    reflectivity: 1.0,
    side: THREE.DoubleSide
});

const boxContainer = new THREE.Group();
boxContainer.visible = true; // RE-ENABLED for a true 3D interactive experience
parallaxGroup.add(boxContainer);

// Inner Cylinder Core (White Ceramic to hide gaps)
const innerBoxGeo = new THREE.CylinderGeometry(cylRadius - 0.05, cylRadius - 0.05, cylHeight, 32);
const innerBoxMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.1,
    clearcoat: 1.0,
    reflectivity: 1.0
});
const innerCylinder = new THREE.Mesh(innerBoxGeo, innerBoxMat);
boxContainer.add(innerCylinder);

// Shards Mesh (White Ceramic)
const shardsMesh = new THREE.InstancedMesh(baseGeo, shardMat, totalShards);
shardsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
boxContainer.add(shardsMesh);

// Gold Outlines Mesh (The gold borders around each diamond)
const lineGeo = new THREE.EdgesGeometry(baseGeo);
const lineMat = new THREE.LineBasicMaterial({ color: 0xd4af37, linewidth: 2 });
const outlinesMesh = new THREE.InstancedMesh(lineGeo, lineMat, totalShards);
outlinesMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
boxContainer.add(outlinesMesh);

const dummy = new THREE.Object3D();

function generateCylinderShards() {
    let idx = 0;
    const shardDataArr = [];
    for (let i = 0; i < heightSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            const angle = j * shardAngle;
            const py = (i - heightSegments / 2 + 0.5) * shardHeight;

            // Stagger rows for diamond pattern
            const angleOffset = (i % 2 === 0) ? 0 : shardAngle / 2;
            const finalAngle = angle + angleOffset;

            dummy.position.set(
                Math.cos(finalAngle) * cylRadius,
                py,
                Math.sin(finalAngle) * cylRadius
            );
            dummy.rotation.set(0, -finalAngle + Math.PI / 2, 0);

            const p0 = dummy.position.clone();
            const r0 = dummy.rotation.clone();
            dummy.updateMatrix();
            shardsMesh.setMatrixAt(idx, dummy.matrix);
            outlinesMesh.setMatrixAt(idx, dummy.matrix);

            // Phase 1: Symmetric Shatter (Wide Left & Right spread)
            const p1 = new THREE.Vector3(
                p0.x * 2.5 + (Math.random() - 0.5) * 16, 
                p0.y * 2.5 + (Math.random() - 0.5) * 10,
                camera.position.z + 5 + Math.random() * 10 
            );
            const r1 = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0);

            // Phase 2: Symmetrical Background noise
            const p2 = new THREE.Vector3(
                (Math.random() - 0.5) * 60, 
                (Math.random() - 0.5) * 40, 
                -25
            );

            shardDataArr.push({ 
                p0, r0, p1, r1, p2, 
                r3: new THREE.Euler(), 
                p3: p0.clone().multiplyScalar(1.2), 
                p4: p0.clone().multiplyScalar(1.4), 
                r4: r0, 
                p5: new THREE.Vector3((Math.random()-0.5)*30, (Math.random()-0.5)*25, 1) 
            });
            idx++;
        }
    }
    return shardDataArr;
}
const shardData = generateCylinderShards();
shardsMesh.instanceMatrix.needsUpdate = true;
outlinesMesh.instanceMatrix.needsUpdate = true;

// --- LUXURY GIFT DETAILS (Ribbon, Bow, Band) ---
const giftDetails = new THREE.Group();
boxContainer.add(giftDetails);

const ribbonMat = new THREE.MeshPhysicalMaterial({ 
    color: 0xd4af37, 
    metalness: 0.8, 
    roughness: 0.2,
    clearcoat: 1.0,
    reflectivity: 1.0
});

// Vertical Ribbons (Wrapping around the cylinder)
const ribbonGeoV = new THREE.BoxGeometry(0.15, cylHeight + 0.1, 0.05);
for (let i = 0; i < 4; i++) {
    const r = new THREE.Mesh(ribbonGeoV, ribbonMat);
    const angle = (i * Math.PI) / 2;
    r.position.set(Math.cos(angle) * (cylRadius + 0.02), 0, Math.sin(angle) * (cylRadius + 0.02));
    r.rotation.y = -angle;
    giftDetails.add(r);
}

// 3D BOW ON TOP (Luxury Loops)
const bowGroup = new THREE.Group();
bowGroup.position.y = cylHeight / 2 + 0.4;
giftDetails.add(bowGroup);

const loopGeo = new THREE.TorusGeometry(0.3, 0.08, 16, 100, Math.PI * 1.5);
const loop1 = new THREE.Mesh(loopGeo, ribbonMat);
loop1.rotation.z = Math.PI / 4;
loop1.position.x = 0.25;
bowGroup.add(loop1);

const loop2 = new THREE.Mesh(loopGeo, ribbonMat);
loop2.rotation.z = -Math.PI / 4;
loop2.rotation.y = Math.PI;
loop2.position.x = -0.25;
bowGroup.add(loop2);

const centerKnot = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), ribbonMat);
bowGroup.add(centerKnot);

// Gold Band (Lid separator)
const bandGeo = new THREE.TorusGeometry(cylRadius + 0.03, 0.04, 16, 100);
const band = new THREE.Mesh(bandGeo, ribbonMat);
band.rotation.x = Math.PI / 2;
band.position.y = cylHeight * 0.22;
giftDetails.add(band);

// --- SCATTERED ROSE PETALS REMOVED ---
const petalsGroup = new THREE.Group();
boxContainer.add(petalsGroup);

// --- PROCEDURAL 3D ROSES ---




// --- PAGE 2: 3D GRID ITEMS ---
const gridGroup = new THREE.Group();
parallaxGroup.add(gridGroup);

const gridItems = [];
const itemGeos = [
    new THREE.TorusKnotGeometry(0.8, 0.2, 100, 16), // Proxy: Bouquet
    new THREE.SphereGeometry(1.2, 32, 32),         // Proxy: Roses
    new THREE.OctahedronGeometry(1.2, 0)           // Proxy: Custom Gift
];
const itemColors = [0xffd700, 0xff0055, 0x00ffff];

itemGeos.forEach((geo, i) => {
    const mat = new THREE.MeshStandardMaterial({ color: itemColors[i], roughness: 0.2, metalness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    const gridSpacing = window.innerWidth < 768 ? 3.5 : 5;
    mesh.position.set((i - 1) * gridSpacing, -20, 0); // Responsive spacing
    gridGroup.add(mesh);
    gridItems.push({ mesh, baseX: (i - 1) * gridSpacing });
});


// --- PAGE 4: CSS3D EMBEDDED VIDEOS ---
const cssGroup = new THREE.Group();
parallaxGroup.add(cssGroup);

// Placeholders for TikTok/Insta embeds
const videoSources = [
    { type: 'local', url: 'vibe-video-2.mp4' },
    { type: 'local', url: 'vibe-video.mp4' }
];
const cssObjects = [];

function openModal(src) {
    let modal = document.getElementById('video-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'video-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.cursor = 'pointer';
        modal.onclick = (e) => {
            // Only close if clicking outside the video
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.innerHTML = '';
            }
        };
        document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    if (src.type === 'youtube') {
        modal.innerHTML = `<iframe width="80%" height="80%" src="${src.url.replace('autoplay=0', 'autoplay=1')}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius:20px;"></iframe>`;
    } else {
        modal.innerHTML = `<video src="${src.url}" style="max-width: 90%; max-height: 90%; border-radius:20px;" controls autoplay></video>`;
    }
}

videoSources.forEach((src, i) => {
    const div = document.createElement('div');
    div.style.width = '280px';
    div.style.height = '480px';
    div.style.backgroundColor = '#000';
    div.style.borderRadius = '15px';
    div.style.cursor = 'pointer';
    div.style.pointerEvents = 'auto'; // allow clicking the wrapper

    if (src.type === 'youtube') {
        div.innerHTML = `<iframe width="280" height="480" src="${src.url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius:15px; pointer-events:none;"></iframe>`;
    } else {
        div.innerHTML = `<video src="${src.url}" width="280" height="480" autoplay loop muted playsinline preload="auto" style="border-radius:15px; object-fit: cover; pointer-events:none;"></video>`;
    }

    // Add click event listener to the wrapper div
    div.addEventListener('click', () => {
        openModal(src);
    });

    const cssObj = new CSS3DObject(div);
    const videoSpacing = window.innerWidth < 768 ? 4.5 : 14;
    cssObj.position.set((i - 0.5) * videoSpacing, 0, -2);
    // Scale down to match WebGL units (pixels to units)
    cssObj.scale.set(0.02, 0.02, 0.02);
    cssGroup.add(cssObj);
    cssObjects.push(cssObj);

    // Hide initially via scale (CSS3D visibility can be tricky)
    cssObj.scale.set(0.001, 0.001, 0.001);
});


// --- GSAP STORYTELLING & SCROLL LOGIC ---
const state = { phase: 0, glow: 0, gridY: -20, cssScale: 0.001 };
let targetColor = new THREE.Color(0xfdfbf7);

window.addEventListener("load", () => {
    gsap.registerPlugin(ScrollTrigger);

    // Initial Drop-in & positioning (Centered for Anti-Gravity effect)
    boxContainer.position.set(0, -1, 4); // Lifted slightly from -2 to -1
    boxContainer.rotation.set(-0.2, 0.2, 0); // Slight upward tilt and rotation

    // Pop-Up Animation as requested
    gsap.from(boxContainer.scale, {
        x: 0, y: 0, z: 0,
        duration: 2,
        ease: "elastic.out(1, 0.5)",
        delay: 0.5
    });

    gsap.from(camera.position, { z: 30, duration: 2.5, ease: "power3.out" });

    const tl = gsap.timeline({
        scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 0.5 }
    });

    // 0 -> 1: Break-Apart Tunnel (Fast)
    tl.to(state, { phase: 1, glow: 2, duration: 0.6 }, 0)
        .to(boxContainer.position, { x: 0, duration: 0.6 }, 0)
        // 1 -> 2: Grid Appears
        .to(state, { phase: 2, glow: 0, gridY: 0, duration: 0.6 })
        // 2 -> 3: Detail View (Fast exit)
        .to(state, { phase: 3, gridY: 15, duration: 0.3 })
        // 3 -> 4: Unfold & Showcase (Quick pop)
        .to(state, { phase: 4, cssScale: 0.03, duration: 0.4 })
        // 4 -> 5: Order Form Assembly (Fast exit)
        .to(state, { phase: 5, cssScale: 0.001, duration: 0.4 });
});

// UI Swatch Interactions
document.querySelectorAll('.swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => { targetColor.set(e.target.dataset.color); });
});


// --- RAYCASTER (Page 2 Click-to-Shatter) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    if (state.phase >= 1.5 && state.phase <= 2.5) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(gridItems.map(g => g.mesh));
        if (intersects.length > 0) {
            const selected = intersects[0].object;
            // Animate selected to center, shatter others
            gridItems.forEach(item => {
                if (item.mesh === selected) {
                    gsap.to(item.mesh.position, { x: 0, y: 0, z: 4, duration: 1.5, ease: "power2.out" });
                    gsap.to(item.mesh.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 1.5 });
                } else {
                    gsap.to(item.mesh.position, {
                        x: (Math.random() - 0.5) * 20,
                        y: (Math.random() - 0.5) * 20,
                        z: -10,
                        duration: 1
                    });
                    gsap.to(item.mesh.scale, { x: 0, y: 0, z: 0, duration: 1 });
                }
            });
        }
    }
});

let targetMouseX = 0; let targetMouseY = 0;
let isHoveringBox = false;

window.addEventListener('mousemove', (event) => {
    targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Hover detection for the main box
    if (state.phase < 0.5) {
        raycaster.setFromCamera(new THREE.Vector2(targetMouseX, targetMouseY), camera);
        const intersects = raycaster.intersectObject(shardsMesh);
        if (intersects.length > 0) {
            if (!isHoveringBox) {
                isHoveringBox = true;
                gsap.to(state, { glow: 2, duration: 0.8, ease: "power2.out" });
                gsap.to(boxContainer.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.5 });
            }
        } else {
            if (isHoveringBox) {
                isHoveringBox = false;
                gsap.to(state, { glow: 0.1, duration: 0.8, ease: "power2.inOut" });
                gsap.to(boxContainer.scale, { x: 1, y: 1, z: 1, duration: 0.5 });
            }
        }
    }
});


// --- RENDER LOOP & PHYSICS ---
const clock = new THREE.Clock();
const q1 = new THREE.Quaternion();
const q2 = new THREE.Quaternion();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Material updates
    shardMat.color.lerp(targetColor, 0.05);
    shardMat.emissiveIntensity = state.glow;

    const v = state.phase;

    // Update Grid Items
    gridItems.forEach((item, i) => {
        if (v < 1.5) {
            item.mesh.position.y = THREE.MathUtils.lerp(item.mesh.position.y, state.gridY, 0.1);
            item.mesh.position.x = item.baseX;
            item.mesh.scale.set(1, 1, 1);
        } else if (v >= 1.5 && v < 2.5) {
            item.mesh.position.y = THREE.MathUtils.lerp(item.mesh.position.y, state.gridY + Math.sin(time * 2 + i) * 0.5, 0.1);
            item.mesh.rotation.y += 0.01;
            item.mesh.rotation.x += 0.005;
        } else if (v >= 2.5) {
            // Move grid away in phases 3+
            item.mesh.position.y = THREE.MathUtils.lerp(item.mesh.position.y, state.gridY, 0.1);
        }
    });

    // Update CSS3D Scales
    cssObjects.forEach(obj => {
        const mobileFactor = window.innerWidth < 768 ? 0.45 : 1;
        const targetScale = state.cssScale * mobileFactor;
        const currentScale = THREE.MathUtils.lerp(obj.scale.x, targetScale, 0.25);
        obj.scale.setScalar(currentScale);

        // Hide completely if too small to avoid the tiny dot issue
        if (currentScale < 0.005) {
            obj.element.style.visibility = 'hidden';
            obj.element.style.pointerEvents = 'none';
        } else {
            obj.element.style.visibility = 'visible';
            obj.element.style.pointerEvents = 'auto';
        }
    });

    if (v <= 1) {
        innerCylinder.scale.setScalar(Math.max(0, 1 - (v * 1.5)));
        giftDetails.scale.setScalar(Math.max(0, 1 - (v * 1.5)));
        innerCylinder.visible = true;
        giftDetails.visible = true;
    } else {
        innerCylinder.visible = false;
        giftDetails.visible = false;
    }

    // InstancedMesh Physics Engine
    for (let i = 0; i < totalShards; i++) {
        const data = shardData[i];
        let tPos = new THREE.Vector3();
        let tRot = new THREE.Euler();

        if (v <= 1) { // 0 -> 1 (Box to Tunnel)
            tPos.lerpVectors(data.p0, data.p1, v);
            q1.setFromEuler(data.r0); q2.setFromEuler(data.r1);
            dummy.quaternion.slerpQuaternions(q1, q2, v);
        }
        else if (v <= 2) { // 1 -> 2 (Tunnel to Grid Bg)
            const t = v - 1;
            tPos.lerpVectors(data.p1, data.p2, t);
            // Orbiting noise
            tPos.x += Math.sin(time + i) * 2;
            tPos.y += Math.cos(time + i) * 2;
            q1.setFromEuler(data.r1); q2.setFromEuler(data.r3);
            dummy.quaternion.slerpQuaternions(q1, q2, t);
        }
        else if (v <= 3) { // 2 -> 3 (Grid Bg to Detail Framing)
            const t = v - 2;
            tPos.lerpVectors(data.p2, data.p3, t);
            dummy.rotation.set(0, time * 0.5, 0); // Gentle swirl
        }
        else if (v <= 4) { // 3 -> 4 (Detail Framing to Unfold)
            const t = v - 3;
            tPos.lerpVectors(data.p3, data.p4, t);
            q1.setFromEuler(dummy.rotation); q2.setFromEuler(data.r4);
            dummy.quaternion.slerpQuaternions(q1, q2, t);
        }
        else if (v <= 5) { // 4 -> 5 (Unfold to Order Form Frame)
            const t = v - 4;
            tPos.lerpVectors(data.p4, data.p5, t);
            // Add subtle floating effect to frame
            tPos.x += Math.sin(time * 2 + i * 0.1) * 0.1;
            tPos.y += Math.cos(time * 2 + i * 0.1) * 0.1;
            dummy.rotation.set(0, 0, 0);
        }

        dummy.position.copy(tPos);
        dummy.updateMatrix();
        shardsMesh.setMatrixAt(i, dummy.matrix);
        outlinesMesh.setMatrixAt(i, dummy.matrix);
    }
    shardsMesh.instanceMatrix.needsUpdate = true;
    outlinesMesh.instanceMatrix.needsUpdate = true;

    // Cinematic Parallax & Floating Effect
    boxContainer.position.y = -2 + Math.sin(time * 0.8) * 0.4;
    parallaxGroup.rotation.x = THREE.MathUtils.lerp(parallaxGroup.rotation.x, -targetMouseY * 0.08, 0.05);
    parallaxGroup.rotation.y = THREE.MathUtils.lerp(parallaxGroup.rotation.y, targetMouseX * 0.08, 0.05);

    // Render both scenes
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;

    // Adjust camera Z on resize for mobile responsiveness
    const isMobileResize = window.innerWidth < 768;
    camera.position.z = isMobileResize ? 25 : 16;
    
    // Update grid spacing on resize
    const gridSpacing = isMobileResize ? 3.5 : 5;
    gridItems.forEach((item, i) => {
        item.baseX = (i - 1) * gridSpacing;
        if (state.phase < 1.5) {
            item.mesh.position.x = item.baseX;
        }
    });
    
    // Update video spacing on resize
    const videoSpacing = isMobileResize ? 4.5 : 14;
    cssObjects.forEach((obj, i) => {
        obj.position.set((i - 0.5) * videoSpacing, 0, -2);
    });

    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 3D PHOTO VIEWER MODAL ---
window.view3D = function (imgSrc) {
    // Create Modal Element
    const modal = document.createElement('div');
    modal.id = 'viewer-3d-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.95); z-index: 9999; display: flex;
        justify-content: center; align-items: center; cursor: pointer;
    `;

    // Close on click
    modal.onclick = (e) => { if (e.target === modal) { document.body.removeChild(modal); } };

    const container = document.createElement('div');
    container.style.width = '80%';
    container.style.height = '80%';
    modal.appendChild(container);
    document.body.appendChild(modal);

    // Three.js Setup for Modal
    const mScene = new THREE.Scene();
    const mCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    mCamera.position.z = 5;

    const mRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    mRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(mRenderer.domElement);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 0, 10);
    mScene.add(light);
    mScene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Photo Plane
    const texture = new THREE.TextureLoader().load(imgSrc);
    const geometry = new THREE.PlaneGeometry(3, 3);
    const material = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
    const photoPlane = new THREE.Mesh(geometry, material);
    mScene.add(photoPlane);

    // Animation
    function mAnimate() {
        if (!document.getElementById('viewer-3d-modal')) return;
        requestAnimationFrame(mAnimate);
        photoPlane.rotation.y += 0.01; // Continuous rotation
        mRenderer.render(mScene, mCamera);
    }
    mAnimate();

    // Close Button
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Close 3D View ×';
    closeBtn.style.cssText = `
        position: absolute; top: 20px; right: 20px; padding: 10px 20px;
        background: #c5a059; color: white; border: none; border-radius: 30px;
        font-family: inherit; cursor: pointer; font-weight: 600;
    `;
    closeBtn.onclick = () => { document.body.removeChild(modal); };
    modal.appendChild(closeBtn);
};