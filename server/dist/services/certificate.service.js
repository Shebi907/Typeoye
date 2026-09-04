"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CERT_MIN_ACCURACY = exports.CERT_MIN_WPM = exports.DEFAULT_CERT_DURATION = exports.CERT_DURATION_KEY = void 0;
exports.getCertificateDuration = getCertificateDuration;
exports.newCertificateCode = newCertificateCode;
exports.renderCertificatePdf = renderCertificatePdf;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const PlatformSetting_1 = __importDefault(require("../models/PlatformSetting"));
exports.CERT_DURATION_KEY = 'certificate.durationSeconds';
exports.DEFAULT_CERT_DURATION = 60;
exports.CERT_MIN_WPM = 30;
exports.CERT_MIN_ACCURACY = 90;
const CERT_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** Admin-configurable certificate test duration (falls back to the default). */
async function getCertificateDuration() {
    const row = await PlatformSetting_1.default.findOne({ key: exports.CERT_DURATION_KEY }).lean();
    return typeof row?.value === 'number' && row.value >= 30 && row.value <= 900
        ? row.value
        : exports.DEFAULT_CERT_DURATION;
}
function newCertificateCode() {
    const bytes = crypto_1.default.randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++)
        code += CERT_ALPHABET[bytes[i] % CERT_ALPHABET.length];
    return `CERT-${new Date().getFullYear()}-${code}`;
}
// ── Fonts (optional bundled TTFs; fall back to built-ins) ────────────────────
const FONTS_DIR = path_1.default.resolve(__dirname, '../../assets/fonts');
const has = (file) => fs_1.default.existsSync(path_1.default.join(FONTS_DIR, file));
// ── Palette ──────────────────────────────────────────────────────────────────
const PRIMARY = '#4263F5';
const SECONDARY = '#6C63FF';
const LAVENDER = '#EEF0FF';
const PAGE_BG_TOP = '#F8F9FF';
const CARD_BORDER = '#DDE2FB';
const NAVY = '#1B2340';
const MUTED = '#69708F';
// ── PDF rendering ────────────────────────────────────────────────────────────
function formatDuration(seconds) {
    if (seconds < 60)
        return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return rest ? `${mins}m ${rest}s` : `${mins} min`;
}
/** Soft fake shadow: a low-opacity offset round-rect behind a card. */
function softShadow(doc, x, y, w, h, r) {
    doc.save();
    doc.fillOpacity(0.07).fillColor(NAVY);
    doc.roundedRect(x - 1, y + 3, w + 2, h + 3, r).fill();
    doc.restore();
}
/** Approximate an elliptical/circular arc with cubic beziers (pdfkit lacks .arc). */
function strokeArc(doc, cx, cy, r, startDeg, endDeg) {
    const rad = (d) => [
        cx + r * Math.cos((d * Math.PI) / 180),
        cy + r * Math.sin((d * Math.PI) / 180),
    ];
    const k = 0.5523;
    let [px, py] = rad(startDeg);
    doc.moveTo(px, py);
    for (let a = startDeg; a < endDeg;) {
        const step = Math.min(60, endDeg - a);
        const a0 = (a * Math.PI) / 180;
        const a1 = ((a + step) * Math.PI) / 180;
        const c1 = [
            cx + (r * k * step) / 90 * Math.cos(a0 - Math.PI / 2),
            cy + (r * k * step) / 90 * Math.sin(a0 - Math.PI / 2),
        ];
        const c2 = [
            cx + (r * k * step) / 90 * Math.cos(a1 + Math.PI / 2),
            cy + (r * k * step) / 90 * Math.sin(a1 + Math.PI / 2),
        ];
        const [ex, ey] = rad(a + step);
        doc.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], ex, ey);
        px = ex;
        py = ey;
        a += step;
    }
    void px;
    void py;
}
/** Small drawn icons for the metric cards (no dingbat fonts needed). */
function iconGauge(doc, cx, cy, s) {
    doc.save();
    doc.lineWidth(1.8).strokeColor(PRIMARY);
    strokeArc(doc, cx, cy, s, 135, 405);
    doc.stroke();
    doc.moveTo(cx, cy).lineTo(cx + s * 0.62, cy - s * 0.5).lineWidth(1.6).stroke();
    doc.circle(cx, cy, s * 0.14).fill(PRIMARY);
    doc.restore();
}
function iconTarget(doc, cx, cy, s) {
    doc.save();
    doc.lineWidth(1.7).strokeColor(PRIMARY);
    doc.circle(cx, cy, s).stroke();
    doc.circle(cx, cy, s * 0.55).stroke();
    doc.circle(cx, cy, s * 0.16).fill(PRIMARY);
    doc.restore();
}
function iconClock(doc, cx, cy, s) {
    doc.save();
    doc.lineWidth(1.8).strokeColor(PRIMARY);
    doc.circle(cx, cy, s).stroke();
    doc.moveTo(cx, cy).lineTo(cx, cy - s * 0.62).moveTo(cx, cy).lineTo(cx + s * 0.5, cy + s * 0.18)
        .lineWidth(1.6).stroke();
    doc.restore();
}
function iconCalendar(doc, x, y, s) {
    doc.save();
    doc.lineWidth(1.3).strokeColor(MUTED);
    doc.roundedRect(x, y, s, s * 0.92, 2).stroke();
    doc.moveTo(x, y + s * 0.3).lineTo(x + s, y + s * 0.3).stroke();
    doc.moveTo(x + s * 0.28, y).lineTo(x + s * 0.28, y - s * 0.22).moveTo(x + s * 0.72, y).lineTo(x + s * 0.72, y - s * 0.22).stroke();
    doc.restore();
}
function iconTag(doc, x, y, s) {
    doc.save();
    doc.lineWidth(1.3).strokeColor(MUTED);
    doc.roundedRect(x, y, s, s * 0.66, 2).stroke();
    doc.circle(x + s * 0.22, y + s * 0.33, s * 0.09).fill(MUTED);
    doc.restore();
}
/** Decorative laurel branch beside the recipient name. */
function laurel(doc, x, y, flip) {
    doc.save();
    if (flip)
        doc.translate(x, y), doc.scale(-1, 1), doc.translate(-x, -y);
    // Stem
    doc.moveTo(x, y + 26).quadraticCurveTo(x + 16, y + 10, x + 20, y - 22);
    doc.lineWidth(1.5).strokeColor(SECONDARY).stroke();
    // Leaves along the stem
    doc.fillColor(SECONDARY).fillOpacity(0.85);
    const leaves = [
        [4, 20, -0.9], [9, 12, -1.15], [13, 3, -1.35], [16, -7, -1.6], [18, -16, -1.85],
    ];
    for (const [dx, dy, rot] of leaves) {
        doc.save();
        doc.translate(x + dx, y + dy);
        doc.rotate((rot * 180) / Math.PI);
        doc.ellipse(0, 0, 7.2, 2.9).fill();
        doc.restore();
    }
    doc.restore();
}
/** Premium circular verification seal. */
function drawSeal(doc, cx, cy, r) {
    doc.save();
    // Soft depth halo
    doc.fillOpacity(0.12).fillColor(PRIMARY).circle(cx, cy + 3, r + 6).fill();
    // Rings
    doc.lineWidth(2).strokeColor(PRIMARY).circle(cx, cy, r).stroke();
    doc.lineWidth(0.9).strokeColor(SECONDARY).circle(cx, cy, r - 4.5).stroke();
    // Inner disc
    doc.fillOpacity(1).fillColor(PRIMARY).circle(cx, cy, r - 9).fill();
    // Check mark
    const s = r / 2.4;
    doc.moveTo(cx - s * 0.72, cy - r * 0.34)
        .lineTo(cx - s * 0.1, cy - r * 0.34 + s * 0.62)
        .lineTo(cx + s * 0.95, cy - r * 0.34 - s * 0.42);
    doc.lineJoin('round').lineCap('round').lineWidth(Math.max(2.4, r / 9)).strokeColor('#ffffff').stroke();
    // Caption inside the disc
    doc.fillColor('#ffffff');
    doc.font('Helvetica-Bold').fontSize(6.4).text('ONLINE TYPING PLATFORM', cx - (r - 12), cy + 2, {
        width: (r - 12) * 2,
        align: 'center',
        characterSpacing: 0.8,
    });
    doc.moveTo(cx - 14, cy + 12).lineTo(cx + 14, cy + 12).lineWidth(0.8).strokeOpacity(0.7).stroke();
    doc.strokeOpacity(1);
    doc.font('Helvetica-Bold').fontSize(7.6).text('SERVER VERIFIED', cx - (r - 10), cy + 16, {
        width: (r - 10) * 2,
        align: 'center',
        characterSpacing: 1.2,
    });
    // Scalloped dots around the outer ring for an official-badge feel
    doc.fillColor(PRIMARY).fillOpacity(0.65);
    const dots = 24;
    for (let i = 0; i < dots; i++) {
        const a = (i / dots) * Math.PI * 2;
        doc.circle(cx + Math.cos(a) * (r + 4.5), cy + Math.sin(a) * (r + 4.5), 0.9).fill();
    }
    doc.restore();
}
/** Render a certificate to a PDF buffer using only server-computed data. */
async function renderCertificatePdf(cert) {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            info: {
                Title: `Typeoye Typing Certificate ${cert.certificateId}`,
                Author: 'Typeoye',
                Subject: 'Typing Proficiency Certificate',
            },
        });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        const W = doc.page.width;
        const H = doc.page.height;
        const cx = W / 2;
        // Optional premium fonts (registered once per render; pdfkit caches by name)
        let serifTitle = 'Times-BoldItalic';
        let serifText = 'Times-Italic';
        let scriptFont = 'Helvetica-Oblique';
        if (has('PlayfairDisplay-Italic.ttf')) {
            doc.registerFont('cert-serif', path_1.default.join(FONTS_DIR, 'PlayfairDisplay-Italic.ttf'));
            serifTitle = 'cert-serif';
            serifText = 'cert-serif';
        }
        if (has('GreatVibes-Regular.ttf')) {
            doc.registerFont('cert-script', path_1.default.join(FONTS_DIR, 'GreatVibes-Regular.ttf'));
            scriptFont = 'cert-script';
        }
        // ── Background ────────────────────────────────────────────────────────
        const bg = doc.linearGradient(0, 0, W * 0.35, H);
        bg.stop(0, '#ffffff').stop(0.55, PAGE_BG_TOP).stop(1, LAVENDER);
        doc.rect(0, 0, W, H).fill(bg);
        // Soft corner shapes (very low opacity, never near text)
        doc.save();
        doc.fillColor(SECONDARY);
        doc.fillOpacity(0.05);
        doc.circle(-30, -40, 110).fill();
        doc.circle(W + 25, H + 30, 130).fill();
        doc.fillOpacity(0.04);
        doc.circle(W - 60, -50, 90).fill();
        doc.circle(70, H + 20, 80).fill();
        // Corner rings
        doc.fillOpacity(1);
        doc.lineWidth(1).strokeColor(SECONDARY).strokeOpacity(0.14);
        doc.circle(46, 44, 26).stroke();
        doc.circle(W - 52, H - 48, 30).stroke();
        doc.strokeOpacity(0.1);
        doc.circle(W - 40, 36, 18).stroke();
        doc.circle(38, H - 36, 16).stroke();
        doc.restore();
        // Flowing wave lines on the left and right sides
        doc.save();
        doc.lineWidth(1.2).strokeColor(PRIMARY);
        const waves = [
            [46, H * 0.32, 0.10], [58, H * 0.42, 0.07], [70, H * 0.52, 0.05],
        ];
        for (const [x, y, op] of waves) {
            doc.strokeOpacity(op);
            doc.moveTo(x, y).bezierCurveTo(x + 40, y - 26, x + 78, y + 26, x + 118, y);
            doc.moveTo(W - x, y).bezierCurveTo(W - x - 40, y - 26, W - x - 78, y + 26, W - x - 118, y);
            doc.stroke();
        }
        doc.restore();
        // ── Border ────────────────────────────────────────────────────────────
        doc.save();
        // Subtle glow
        doc.lineWidth(6).strokeColor(PRIMARY).strokeOpacity(0.10);
        doc.roundedRect(21, 21, W - 42, H - 42, 18).stroke();
        // Outer elegant rule
        doc.strokeOpacity(1).lineWidth(1.6).strokeColor(PRIMARY);
        doc.roundedRect(24, 24, W - 48, H - 48, 16).stroke();
        // Inner hairline
        doc.lineWidth(0.75).strokeColor(CARD_BORDER);
        doc.roundedRect(31, 31, W - 62, H - 62, 11).stroke();
        // Corner accents on the inner frame
        doc.lineWidth(2.2).strokeColor(PRIMARY).lineCap('round');
        const m = 31, t = 20, k = 39;
        const ticks = [
            [k, m + t, k, m], [k, m, m + t, m],
            [W - k - t, m, W - k, m], [W - k, m, W - k, m + t],
            [k, H - m - t, k, H - m], [k, H - m, k + t, H - m],
            [W - k - t, H - m, W - k, H - m], [W - k, H - m - t, W - k, H - m],
        ];
        for (const [x1, y1, x2, y2] of ticks)
            doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
        doc.restore();
        // ── Header ────────────────────────────────────────────────────────────
        doc.font('Helvetica-Bold').fontSize(14).fillColor(PRIMARY).text('T Y P E O Y E', 0, 56, {
            width: W, align: 'center', characterSpacing: 5,
        });
        doc.font(serifTitle).fontSize(41).fillColor(NAVY);
        if (serifTitle === 'cert-serif') {
            doc.strokeColor(NAVY).lineWidth(0.45);
        }
        doc.text('Certificate of Achievement', 60, 82, { width: W - 120, align: 'center' });
        if (serifTitle === 'cert-serif') {
            doc.lineWidth(0);
        }
        // Divider with diamond ornament
        const divY = 150;
        doc.moveTo(cx - 105, divY).lineTo(cx - 26, divY).lineWidth(1).strokeColor(PRIMARY).strokeOpacity(0.75).stroke();
        doc.moveTo(cx + 26, divY).lineTo(cx + 105, divY).stroke();
        doc.strokeOpacity(1);
        doc.circle(cx - 112, divY, 1.6).fillColor(SECONDARY).fillOpacity(0.7).fill();
        doc.circle(cx + 112, divY, 1.6).fill();
        doc.fillOpacity(1).save();
        doc.translate(cx, divY);
        doc.rotate(45);
        doc.rect(-3.4, -3.4, 6.8, 6.8).fillColor(PRIMARY).fill();
        doc.restore();
        // ── Recipient ─────────────────────────────────────────────────────────
        doc.font(serifText === 'cert-serif' ? 'cert-serif' : 'Times-Roman')
            .fontSize(13.5).fillColor(MUTED)
            .text('This certificate is proudly presented to', 0, 168, { width: W, align: 'center' });
        doc.font(serifTitle).fontSize(47).fillColor(NAVY);
        if (serifTitle === 'cert-serif') {
            doc.strokeColor(NAVY).lineWidth(0.55);
        }
        doc.text(cert.recipientName, 60, 194, { width: W - 120, align: 'center', ellipsis: true, height: 64 });
        if (serifTitle === 'cert-serif') {
            doc.lineWidth(0);
        }
        // Laurels flanking the name
        const nameSize = doc.widthOfString(cert.recipientName.slice(0, 40)) * 0.92;
        const nameHalf = Math.min(nameSize / 2 + 34, cx - 120);
        laurel(doc, cx - nameHalf, 232, false);
        laurel(doc, cx + nameHalf, 232, true);
        // ── Achievement description ("Typeoye" highlighted) ───────────────────
        const descParts = [
            { text: 'for outstanding typing performance in a ', color: '#3c4257' },
            { text: formatDuration(cert.durationSeconds), color: '#3c4257' },
            { text: ' typing test on the ', color: '#3c4257' },
            { text: 'Typeoye', color: PRIMARY },
            { text: ' platform.', color: '#3c4257' },
        ];
        doc.font('Helvetica').fontSize(13);
        const totalDesc = descParts.reduce((acc, p) => acc + doc.widthOfString(p.text), 0);
        let dx = cx - totalDesc / 2;
        const descY = 276;
        for (const part of descParts) {
            doc.fillColor(part.color).text(part.text, dx, descY, { lineBreak: false });
            dx += doc.widthOfString(part.text);
        }
        // ── Performance statistics ────────────────────────────────────────────
        const cardW = 172;
        const cardH = 96;
        const gap = 26;
        const startX = cx - (cardW * 3 + gap * 2) / 2;
        const cardY = 310;
        const stats = [
            { value: `${Math.round(cert.wpm * 10) / 10}`, label: 'WORDS PER MINUTE', icon: iconGauge },
            { value: `${Math.round(cert.accuracy * 10) / 10}%`, label: 'ACCURACY', icon: iconTarget },
            { value: formatDuration(cert.durationSeconds), label: 'DURATION', icon: iconClock },
        ];
        stats.forEach((stat, i) => {
            const x = startX + i * (cardW + gap);
            softShadow(doc, x, cardY, cardW, cardH, 14);
            doc.save();
            doc.roundedRect(x, cardY, cardW, cardH, 14).lineWidth(1)
                .fillAndStroke(LAVENDER, CARD_BORDER);
            // Icon centered near top
            stat.icon(doc, x + cardW / 2, cardY + 20, 7.5);
            // Value
            doc.font('Helvetica-Bold').fontSize(24).fillColor(PRIMARY)
                .text(stat.value, x, cardY + 33, { width: cardW, align: 'center' });
            // Label
            doc.font('Helvetica-Bold').fontSize(7.6).fillColor(MUTED)
                .text(stat.label, x, cardY + cardH - 20, { width: cardW, align: 'center', characterSpacing: 1.8 });
            doc.restore();
        });
        // ── Footer ────────────────────────────────────────────────────────────
        const issued = new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
        const footerBase = H - 84;
        // Left: date + certificate ID
        iconCalendar(doc, 68, footerBase - 2, 11);
        doc.font('Helvetica').fontSize(10).fillColor(MUTED)
            .text(`Date Issued: ${issued}`, 86, footerBase, { lineBreak: false });
        iconTag(doc, 68, footerBase + 20, 13);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY)
            .text(cert.certificateId, 86, footerBase + 19, { characterSpacing: 1.6, lineBreak: false });
        // Center: signature
        const sigName = cert.recipientName.length > 0 ? 'Typeoye Team' : 'Typeoye Team';
        doc.font(scriptFont).fontSize(27).fillColor(NAVY)
            .text(sigName, 0, H - 96, { width: W, align: 'center' });
        doc.moveTo(cx - 70, H - 58).lineTo(cx + 70, H - 58).lineWidth(0.9).strokeColor(CARD_BORDER).stroke();
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(PRIMARY)
            .text('Typeoye Team', 0, H - 53, { width: W, align: 'center' });
        doc.font('Helvetica').fontSize(7.8).fillColor(MUTED)
            .text('Thank you for being part of our community!', 0, H - 39, { width: W, align: 'center' });
        // Right: verification seal
        drawSeal(doc, W - 104, H - 104, 46);
        doc.end();
    });
}
//# sourceMappingURL=certificate.service.js.map