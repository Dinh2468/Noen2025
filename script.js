const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let snowCanvas, snowCtx;
let treeCanvas, treeCtx;
let particles = [];
let width, height;
let extraSnow = [];
let windForce = 0; // Lực gió mặc định bằng 0
const extraSnowCount = 300; // Số lượng bông tuyết rơi thêm
const particleCount = 5500;
let scrollProgress = 0;
let angle3D = 0;

const bgm = document.getElementById('bgm');
let isMusicPlaying = false;
if (bgm) bgm.volume = 0.4;

const subMsg = document.getElementById('sub-msg');

function init() {

    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    // Canvas cho hoa tuyết (Sắc nét)
    snowCanvas = document.createElement('canvas');
    snowCanvas.width = width; snowCanvas.height = height;
    snowCtx = snowCanvas.getContext('2d');

    // Canvas cho cây thông (Có vệt mờ lung linh)
    treeCanvas = document.createElement('canvas');
    treeCanvas.width = width; treeCanvas.height = height;
    treeCtx = treeCanvas.getContext('2d');

    particles = []; // Reset mảng khi resize
    for (let i = 0; i < particleCount; i++) {
        const rx = Math.random() * width;
        const ry = Math.random() * height;
        particles.push({
            x: rx, // Đồng bộ x
            y: ry, // Đồng bộ y
            originX: rx,
            originY: ry,
            size: Math.random() * 2 + 1,
            color: `white`,
            vx: (Math.random() - 0.5) * 0.2, // Gió cực nhẹ
            vy: Math.random() * 1.5 + 0.8,   // Tốc độ rơi mượt
            targetX: 0,
            targetY: 0,
            targetZ: 0
        });
    }
    calculateTreePositions();

    // Khởi tạo thêm tuyết rơi phụ
    extraSnow = [];
    for (let i = 0; i < extraSnowCount; i++) {
        // z đại diện cho độ xa: 0.2 (xa nhất) đến 1.0 (gần nhất)
        const z = Math.random() * 0.8 + 0.2;
        extraSnow.push({
            x: Math.random() * width,
            y: Math.random() * height,
            z: z, // Lưu giá trị độ sâu
            size: (Math.random() * 1.5 + 0.5) * z, // Kích thước tỷ lệ với z
            vx: (Math.random() - 0.5) * 0.5 * z,   // Gió thổi nhẹ hơn ở xa
            vy: (Math.random() * 1 + 0.5) * z,     // Rơi chậm hơn ở xa
            alpha: (Math.random() * 0.4 + 0.1) * z, // Mờ hơn ở xa
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            twinkleSpeed: (Math.random() * 0.02 + 0.01) * z,
            hasStartedFalling: false
        });
    }
    // Sắp xếp mảng để bông hoa ở xa (z nhỏ) được vẽ trước
    extraSnow.sort((a, b) => a.z - b.z);
}
function calculateTreePositions() {
    const totalParticles = particles.length;
    const starCount = 300;
    const trunkCount = 200;
    const decorationCount = 600; // Số lượng hạt làm dây đèn
    const leafCount = totalParticles - starCount - trunkCount - decorationCount;

    particles.forEach((p, i) => {
        if (i < starCount) {
            // --- GIỮ NGUYÊN CODE NGÔI SAO CỦA BẠN ---
            const step = Math.PI / 5;
            const starIndex = Math.floor(Math.random() * 10);
            const angle = starIndex * step - Math.PI / 2;
            const outerR = 25;
            const innerR = 12;
            const rBase = (starIndex % 2 === 0) ? outerR : innerR;
            const f = Math.sqrt(Math.random());
            const r = f * rBase;
            const jitter = (Math.random() - 0.5) * 5;
            p.targetX = Math.cos(angle) * r + jitter;
            p.targetY = height * 0.15 + Math.sin(angle) * r + jitter;
            p.targetZ = (Math.random() - 0.5) * 10;
            const starGolds = ['#f1c40f', '#f39c12', '#ffdb58', '#fff700'];
            p.color = starGolds[Math.floor(Math.random() * starGolds.length)];
            p.isStar = true;
        }
        else if (i < starCount + decorationCount) {
            // --- DÂY ĐÈN XOẮN ỐC ÔM KHÍT VÀNH NGOÀI ---
            const progress = (i - starCount) / decorationCount;
            const spiralTurns = 5;

            const startY = height * 0.15;
            const treeHeight = height * 0.5;

            p.targetY = startY + progress * treeHeight;

            // ĐIỀU CHỈNH TẠI ĐÂY:
            // minR: Tăng lên 55 để dây đèn bắt đầu từ vành lá trên cùng (không phải từ 0)
            // maxR: Tăng lên 185 để dây đèn chạm khít vành lá to nhất ở đáy
            // Khoảng đệm +2 để dây đèn nằm sát rạt vành lá
            const minR = 20;
            const maxR = 160;
            const r = (minR + progress * (maxR - minR)) + 2;

            const theta = progress * Math.PI * 2 * spiralTurns;

            p.targetX = Math.cos(theta) * r;
            p.targetZ = Math.sin(theta) * r;

            const lightColors = ['#ff0000', '#00ffff', '#ffff00', '#ff00ff', '#ffffff'];
            p.color = lightColors[Math.floor(Math.random() * lightColors.length)];
            p.isLight = true;
        }
        else if (i < starCount + decorationCount + leafCount) {
            // --- GIỮ NGUYÊN CODE LÁ CÂY CỦA BẠN ---
            // ... (Phần logic leafCount cũ của bạn)
            const numLayers = 6;
            const leafIndex = i - starCount - decorationCount;
            const layerLevel = Math.floor(leafIndex / (leafCount / numLayers));
            const startY = height * 0.15;
            const layerGap = height * 0.08;
            const yMin = startY + (layerLevel * layerGap);
            const actualGap = layerGap * 1.5;
            const randomYWeight = Math.pow(Math.random(), 0.7);
            const py = yMin + randomYWeight * actualGap;
            const baseWidth = (layerLevel + 1) * 22 + 25;
            const relativeY = (py - yMin) / actualGap;
            const rMax = relativeY * baseWidth;
            const r = Math.sqrt(Math.random()) * rMax;
            const theta = Math.random() * Math.PI * 2;
            p.targetX = Math.cos(theta) * r;
            p.targetY = py;
            p.targetZ = Math.sin(theta) * r;
            const greenShades = ['#2ecc71', '#27ae60', '#155d27', '#0b3d1a'];
            p.color = greenShades[Math.floor(Math.random() * greenShades.length)];
        }
        else {
            // --- GIỮ NGUYÊN CODE THÂN CÂY CỦA BẠN ---
            const r = Math.random() * 12;
            const theta = Math.random() * Math.PI * 2;
            p.targetX = Math.cos(theta) * r;
            p.targetY = height * 0.65 + Math.random() * 70;
            p.targetZ = Math.sin(theta) * r;
            const woodBrows = ['#5d4037', '#3e2723', '#795548', '#4e342e', '#21100b'];
            p.color = woodBrows[Math.floor(Math.random() * woodBrows.length)];
        }
    });
}

function renderParticle(p) {
    if (p.isHidden) return;
    const easing = scrollProgress > 0.1 ? 1 : 0.12;
    p.x += (p.drawX - p.x) * easing;
    p.y += (p.drawY - p.y) * easing;
    const scale = (p.currentZ3D + 200) / 400;
    let alpha = Math.min(1, scale + 0.2);
    let finalSize = Math.max(0.6, p.size * scale * (0.4 + scrollProgress * 0.8));

    treeCtx.beginPath();
    if (scrollProgress > 0.8 && (p.isLight || p.isStar)) {
        treeCtx.shadowBlur = (p.isStar ? 20 : 5) * scale;
        treeCtx.shadowColor = p.color;
    }
    treeCtx.arc(p.x, p.y, finalSize, 0, Math.PI * 2);
    treeCtx.fillStyle = scrollProgress > 0.5 ? p.color : 'white';
    treeCtx.globalAlpha = alpha;
    treeCtx.fill();
    treeCtx.shadowBlur = 0;
}

function drawSnowflake(ctx, x, y, size, alpha, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();

    // Hiệu ứng phát sáng nhẹ khi alpha cao
    if (alpha > 0.5) {
        ctx.shadowBlur = 5;
        ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
    }

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < 6; i++) {
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size);
        if (size > 6) {
            ctx.moveTo(0, -size * 0.5);
            ctx.lineTo(-size * 0.35, -size * 0.75);
            ctx.moveTo(0, -size * 0.5);
            ctx.lineTo(size * 0.35, -size * 0.75);
        }
        ctx.rotate(Math.PI / 3);
    }
    ctx.stroke();
    ctx.restore();
}
function draw() {
    angle3D += 0.01;
    treeCtx.fillStyle = 'rgba(0, 5, 10, 0.2)';
    treeCtx.fillRect(0, 0, width, height);

    particles.forEach(p => {
        p.originY += p.vy; p.originX += p.vx;
        if (p.originY > height) { p.originY = -20; p.originX = Math.random() * width; }
        if (scrollProgress < 0.001) {
            p.drawX = p.originX; p.drawY = p.originY;
            p.x = p.originX; p.y = p.originY;
        } else {
            p.currentX3D = (p.targetX * Math.cos(angle3D) - p.targetZ * Math.sin(angle3D)) + width / 2;
            p.currentZ3D = p.targetX * Math.sin(angle3D) + p.targetZ * Math.cos(angle3D);
            let influence = Math.pow(scrollProgress, 3);
            p.drawX = p.originX + (p.currentX3D - p.originX) * influence;
            p.drawY = p.originY + (p.targetY - p.originY) * influence;
            p.isHidden = (p.drawY < p.originY - 1 && scrollProgress < 0.7);
        }
    });

    const renderOrder = [...particles].sort((a, b) => a.currentZ3D - b.currentZ3D);
    renderOrder.forEach(p => renderParticle(p));

    snowCtx.clearRect(0, 0, width, height);
    if (scrollProgress > 0.99) {
        extraSnow.forEach(s => {
            if (!s.hasStartedFalling) { s.y = Math.random() * -height; s.hasStartedFalling = true; }
            s.y += s.vy * 4.0;
            s.x += s.vx + (windForce * s.z);
            const fSize = s.size * 12;
            if (s.y > height + fSize) { s.y = -fSize; s.x = Math.random() * width; }
            if (s.x > width + fSize) s.x = -fSize; if (s.x < -fSize) s.x = width + fSize;

            const baseAlpha = (s.alpha + 0.2) * s.z;
            const finalAlpha = baseAlpha + Math.sin(Date.now() * s.twinkleSpeed) * 0.1;
            drawSnowflake(snowCtx, s.x, s.y, fSize, (Math.abs(s.x - width / 2) < 160 ? finalAlpha * 0.1 : finalAlpha), s.rotation);
            s.rotation += s.rotationSpeed;
        });
    } else { extraSnow.forEach(s => s.hasStartedFalling = false); }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(treeCanvas, 0, 0);
    if (scrollProgress > 0.99) ctx.drawImage(snowCanvas, 0, 0);

    requestAnimationFrame(draw);
}

window.addEventListener('scroll', () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = window.scrollY / maxScroll;

    const msg = document.querySelector('.scroll-msg');
    const img1 = document.getElementById('img1');
    const img2 = document.getElementById('img2');

    const images = document.querySelectorAll('.memory-photo');

    if (scrollProgress > 0.95) { // Thay 0.99 bằng 0.95 để ảnh hiện sớm hơn và ổn định hơn
        images.forEach((img, index) => {
            setTimeout(() => {
                img.classList.add('show');
            }, index * 200);
        });

    } else {
        images.forEach(img => img.classList.remove('show'));
    }

    if (!isMusicPlaying && scrollProgress > 0.01 && bgm) {
        bgm.play().catch(() => { });
        isMusicPlaying = true;
    }

    if (scrollProgress > 0.98) {
        msg.innerHTML = "MERRY CHRISTMAS ❤️";
        msg.style.color = "#e63946";
        msg.style.textShadow = "0 0 8px rgba(255, 255, 255, 0.2)";
        subMsg.innerHTML = "Chúc bạn một mùa Giáng sinh an lành, ấm áp bên gia đình và người thân.<br>Hy vọng mọi điều ước của bạn sẽ trở thành hiện thực!";
        subMsg.style.opacity = "1"; // Hiện lời chúc
    } else {
        msg.innerHTML = "Cuộn chuột xuống để thấy điều kỳ diệu...";
        msg.style.color = "rgba(255, 255, 255, 0.7)";
        subMsg.style.opacity = "0";
    }
});

window.addEventListener('mousemove', (e) => {
    const offset = (e.clientX - width / 2) / (width / 2);
    windForce = offset * 2.0;
});

window.addEventListener('resize', init);
init();
draw();