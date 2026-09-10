"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CERT_MIN_ACCURACY = exports.CERT_MIN_WPM = exports.DEFAULT_CERT_DURATION = exports.CERT_DURATION_KEY = void 0;
exports.getCertificateDuration = getCertificateDuration;
exports.newCertificateCode = newCertificateCode;
exports.certificateCodeFor = certificateCodeFor;
exports.formatCertificateDate = formatCertificateDate;
exports.computeKeystrokes = computeKeystrokes;
exports.performanceLevel = performanceLevel;
exports.formatTestDuration = formatTestDuration;
exports.sanitizeCertificateFileName = sanitizeCertificateFileName;
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
/**
 * Deterministic certificate ID derived from the test end-time and recipient
 * name. This ensures the same test always produces the same certificate ID
 * regardless of how many times the PDF is regenerated (e.g. re-downloads).
 * The server generates this once at test completion and returns it as a
 * response header so the client can show it in the preview.
 */
function certificateCodeFor(endTime, recipientName) {
    const date = new Date(endTime);
    const year = date.getFullYear();
    const seed = `CERT-${year}-${endTime}-${recipientName.toLowerCase().trim()}`;
    const hash = crypto_1.default.createHash('sha256').update(seed).digest();
    let code = '';
    for (let i = 0; i < 6; i++)
        code += CERT_ALPHABET[hash[i] % CERT_ALPHABET.length];
    return `CERT-${year}-${code}`;
}
/** Format a Date/ISO string as "September 7, 2026" for the certificate. */
function formatCertificateDate(d) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
/** Total characters actually typed (server-computed, never trusted from the client). */
function computeKeystrokes(typedWords) {
    return typedWords.reduce((acc, w) => acc + w.typed.length, 0);
}
/** Performance band derived from WPM. Only reachable for earned certificates. */
function performanceLevel(wpm) {
    if (wpm >= 90)
        return 'OUTSTANDING';
    if (wpm >= 70)
        return 'EXCELLENT';
    if (wpm >= 50)
        return 'PROFICIENT';
    return 'COMPETENT';
}
/** Whole-minute label for the selected test duration (60 → "1 Minute", 300 → "5 Minutes"). */
function formatTestDuration(seconds) {
    const mins = Math.max(1, Math.round(seconds / 60));
    return mins === 1 ? '1 Minute' : `${mins} Minutes`;
}
/** Safe filename fragment derived from the recipient name. */
function sanitizeCertificateFileName(name, fallback = 'Certificate') {
    const cleaned = name
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    return (cleaned || fallback).slice(0, 48);
}
// ── Fonts (optional bundled TTFs; fall back to built-ins) ────────────────────
const FONTS_DIR = path_1.default.resolve(__dirname, '../../assets/fonts');
const has = (file) => fs_1.default.existsSync(path_1.default.join(FONTS_DIR, file));
// Blue rounded-square Typeoye icon (matches the browser-tab favicon).
const LOGO_PATH = path_1.default.resolve(__dirname, '../../assets/typeoye-logo.png');
function readLogo() {
    if (!fs_1.default.existsSync(LOGO_PATH))
        return null;
    try {
        return fs_1.default.readFileSync(LOGO_PATH);
    }
    catch {
        return null;
    }
}
/** Parse PNG dimensions from the IHDR chunk (bytes 16..23, big-endian). */
function pngSize(buf) {
    const sig = buf.length >= 8 && buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG';
    if (!sig || buf.length < 24)
        return { width: 0, height: 0 };
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
// ── Palette (Typeoye brand — blue → purple, navy text, lavender accents) ─────
const PRIMARY = '#4361EE';
const SECONDARY = '#8B5CF6';
const NAVY = '#1B2340';
const MUTED = '#69708F';
const BODY_TEXT = '#333A55';
const LAVENDER_BG = '#F4F5FE';
const CARD_BORDER = '#DDDEFB';
// ── Drawing helpers ──────────────────────────────────────────────────────────
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
// Card icons
function iconGauge(doc, cx, cy, s) {
    doc.save();
    doc.lineWidth(1.7).strokeColor(PRIMARY);
    strokeArc(doc, cx, cy, s, 135, 405);
    doc.stroke();
    doc.moveTo(cx, cy).lineTo(cx + s * 0.6, cy - s * 0.5).lineWidth(1.5).stroke();
    doc.circle(cx, cy, s * 0.14).fill(PRIMARY);
    doc.restore();
}
function iconTarget(doc, cx, cy, s) {
    doc.save();
    doc.lineWidth(1.6).strokeColor(PRIMARY);
    doc.circle(cx, cy, s).stroke();
    doc.circle(cx, cy, s * 0.55).stroke();
    doc.circle(cx, cy, s * 0.16).fill(PRIMARY);
    doc.restore();
}
function iconClock(doc, cx, cy, s) {
    doc.save();
    doc.lineWidth(1.7).strokeColor(PRIMARY);
    doc.circle(cx, cy, s).stroke();
    doc.moveTo(cx, cy).lineTo(cx, cy - s * 0.62).moveTo(cx, cy).lineTo(cx + s * 0.48, cy + s * 0.18)
        .lineWidth(1.5).stroke();
    doc.restore();
}
/** Corner angle ticks — premium certificate accent. */
function cornerTick(doc, x, y, dirX, dirY, len) {
    doc.save();
    doc.lineWidth(2).strokeColor(PRIMARY).strokeOpacity(0.75);
    doc.moveTo(x, y).lineTo(x + dirX * len, y);
    doc.moveTo(x, y).lineTo(x, y + dirY * len);
    doc.stroke();
    doc.restore();
}
/** Premium stat card with icon chip, value and label. */
function statCard(doc, x, y, w, h, value, label, icon) {
    const r = 12;
    doc.save();
    // Soft shadow
    doc.fillOpacity(0.07).fillColor(NAVY);
    doc.roundedRect(x + 1, y + 3, w, h, r).fill();
    // Card body: white → lavender gradient
    doc.fillOpacity(1);
    const grad = doc.linearGradient(x, y, x, y + h);
    grad.stop(0, '#FFFFFF').stop(1, LAVENDER_BG);
    doc.roundedRect(x, y, w, h, r).fill(grad);
    // Border
    doc.lineWidth(0.8).strokeColor(CARD_BORDER).strokeOpacity(1);
    doc.roundedRect(x, y, w, h, r).stroke();
    // Top accent bar (gradient)
    const accent = doc.linearGradient(x + 1, 0, x + w - 1, 0);
    accent.stop(0, PRIMARY).stop(1, SECONDARY);
    doc.roundedRect(x + 1, y + 1, w - 2, 3, 1.5).fill(accent);
    // Icon chip
    doc.fillOpacity(1).fillColor('#EEF0FF');
    const chipR = 12;
    doc.circle(x + w / 2, y + h * 0.4, chipR).fill();
    doc.lineWidth(0.8).strokeColor('#D9DDFB');
    doc.circle(x + w / 2, y + h * 0.4, chipR).stroke();
    icon(doc, x + w / 2, y + h * 0.4, chipR * 0.55);
    // Value
    const vfs = value.length > 8 ? 16 : 20;
    doc.font('Helvetica-Bold').fontSize(vfs).fillColor(NAVY)
        .text(value, x, y + h * 0.5, { width: w, align: 'center', height: 22 });
    // Label
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED)
        .text(label.toUpperCase(), x, y + h - 20, { width: w, align: 'center', characterSpacing: 1.5 });
    doc.restore();
}
/** Render the official Typeoye certificate to a vector PDF buffer (A4 landscape). */
async function renderCertificatePdf(cert) {
    return new Promise((resolve, reject) => {
        // Landscape A4 (841.89 × 595.28 points)
        const W = 841.89;
        const H = 595.28;
        const doc = new pdfkit_1.default({
            size: [W, H],
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
        const cx = W / 2;
        // Optional bundled fonts
        let serifFont = 'Helvetica';
        let scriptFont = 'Helvetica-Oblique';
        if (has('PlayfairDisplay-Italic.ttf')) {
            doc.registerFont('cert-serif', path_1.default.join(FONTS_DIR, 'PlayfairDisplay-Italic.ttf'));
            serifFont = 'cert-serif';
        }
        if (has('GreatVibes-Regular.ttf')) {
            doc.registerFont('cert-script', path_1.default.join(FONTS_DIR, 'GreatVibes-Regular.ttf'));
            scriptFont = 'cert-script';
        }
        // ── Background: clean white → very light lavender gradient ────────────
        const bg = doc.linearGradient(0, 0, W, H);
        bg.stop(0, '#FFFFFF').stop(0.6, '#FCFCFF').stop(1, '#F2F1FF');
        doc.rect(0, 0, W, H).fill(bg);
        // ── Subtle abstract curved shapes in the corners ──────────────────────
        const cornerArc = (x, y, r, a, b) => {
            doc.save();
            doc.lineWidth(1.1).strokeColor(SECONDARY).strokeOpacity(0.22);
            strokeArc(doc, x, y, r, a, b);
            doc.stroke();
            doc.restore();
        };
        cornerArc(28, 28, 20, 180, 270);
        cornerArc(W - 28, 28, 20, 270, 360);
        cornerArc(28, H - 28, 20, 90, 180);
        cornerArc(W - 28, H - 28, 20, 0, 90);
        // Very subtle dot clusters near each corner
        doc.save();
        doc.fillOpacity(0.18).fillColor(PRIMARY);
        for (const [dx, dy] of [[46, 46], [34, 58], [58, 34]])
            doc.circle(dx, dy, 1.3).fill();
        for (const pair of [[W - 46, 46], [W - 34, 58], [W - 58, 34]]) {
            doc.circle(pair[0], pair[1], 1.3).fill();
        }
        for (const pair of [[46, H - 46], [34, H - 58], [58, H - 34]]) {
            doc.circle(pair[0], pair[1], 1.3).fill();
        }
        for (const pair of [[W - 46, H - 46], [W - 34, H - 58], [W - 58, H - 34]]) {
            doc.circle(pair[0], pair[1], 1.3).fill();
        }
        doc.restore();
        // ── Refined thin double border ────────────────────────────────────────
        doc.save();
        doc.lineWidth(1.1).strokeColor(PRIMARY).strokeOpacity(0.4);
        doc.roundedRect(20, 20, W - 40, H - 40, 10).stroke();
        doc.lineWidth(0.5).strokeColor(CARD_BORDER).strokeOpacity(1);
        doc.roundedRect(26, 26, W - 52, H - 52, 8).stroke();
        doc.restore();
        // Corner accent ticks
        const tickLen = 13;
        cornerTick(doc, 30, 30, 1, 1, tickLen);
        cornerTick(doc, W - 30, 30, -1, 1, tickLen);
        cornerTick(doc, 30, H - 30, 1, -1, tickLen);
        cornerTick(doc, W - 30, H - 30, -1, -1, tickLen);
        // ── Brand lockup: logo + "Typeoye" as one header ──────────────────────
        const logo = readLogo();
        const brandWord = 'Typeoye';
        if (logo) {
            const dims = pngSize(logo);
            const s = dims.width > 0 && dims.height > 0 ? (dims.width / dims.height) : 1;
            const logoSize = 40;
            const logoW = s >= 1 ? logoSize : logoSize * s;
            const logoH = s >= 1 ? logoSize / s : logoSize;
            doc.font('Helvetica-Bold').fontSize(20);
            const wordW = doc.widthOfString(brandWord, { characterSpacing: 0.5 });
            const gap = 12;
            const totalW = logoW + gap + wordW;
            const startX = cx - totalW / 2;
            const brandTop = 44;
            const brandGrad = doc.linearGradient(startX + logoW + gap, 0, startX + totalW, 0);
            brandGrad.stop(0, PRIMARY).stop(1, SECONDARY);
            doc.image(logo, startX, brandTop, { width: logoW, height: logoH });
            // Wordmark vertically centered with the logo tile
            doc.font('Helvetica-Bold').fontSize(20).fillColor(brandGrad)
                .text(brandWord, startX + logoW + gap, brandTop + logoH / 2 - 9, { characterSpacing: 0.5 });
        }
        // ── Title ────────────────────────────────────────────────────────────
        const titleY = 98;
        doc.font('Helvetica-Bold').fontSize(21).fillColor(NAVY)
            .text('TYPING CERTIFICATE', 0, titleY, { width: W, align: 'center', characterSpacing: 4 });
        // Gradient accent rule under the title
        const ruleW = 140;
        const ruleGrad = doc.linearGradient(cx - ruleW / 2, 0, cx + ruleW / 2, 0);
        ruleGrad.stop(0, PRIMARY).stop(1, SECONDARY);
        doc.save();
        doc.roundedRect(cx - ruleW / 2, titleY + 32, ruleW, 2.2, 1.1).fill(ruleGrad);
        doc.restore();
        // ── Presented to ─────────────────────────────────────────────────────
        const presentedY = 148;
        doc.font('Helvetica').fontSize(9.5).fillColor(MUTED)
            .text('PROUDLY PRESENTED TO', 0, presentedY, { width: W, align: 'center', characterSpacing: 2.5 });
        // Dotted hairline flanking the "presented to" line
        doc.save();
        doc.lineWidth(0.6).strokeColor(SECONDARY).strokeOpacity(0.3);
        doc.dash(0.6, { space: 4 });
        doc.moveTo(cx - 260, presentedY + 4).lineTo(cx - 95, presentedY + 4).stroke();
        doc.moveTo(cx + 95, presentedY + 4).lineTo(cx + 260, presentedY + 4).stroke();
        doc.undash();
        doc.restore();
        // ── Name (prominent serif/script style) ──────────────────────────────
        const nameText = cert.recipientName.trim();
        const nameFontSize = nameText.length > 30 ? 21 : nameText.length > 18 ? 26 : 31;
        doc.font(serifFont).fontSize(nameFontSize).fillColor(NAVY)
            .text(nameText, cx - 320, 164, {
            width: 640,
            align: 'center',
            ellipsis: true,
            height: 46,
            characterSpacing: 0.5,
        });
        // ── Statement (two explicit lines) ───────────────────────────────────
        doc.font('Helvetica').fontSize(11).fillColor(BODY_TEXT)
            .text('has successfully completed the Typing Test on Typeoye\nand has demonstrated excellent typing skills.', 0, 226, { width: W, align: 'center', lineGap: 5, characterSpacing: 0.3 });
        // ── 3 stat tiles: WPM, ACCURACY, TEST DURATION ───────────────────────
        const cards = [
            { value: `${Math.round(cert.wpm)}`, label: 'WPM', icon: iconGauge },
            { value: `${Math.round(cert.accuracy * 10) / 10}%`, label: 'ACCURACY', icon: iconTarget },
            { value: formatTestDuration(cert.durationSeconds), label: 'TEST DURATION', icon: iconClock },
        ];
        const cardGap = 24;
        const cardW = 175;
        const cardH = 95;
        const totalCardsW = cards.length * cardW + (cards.length - 1) * cardGap;
        const cardsStartX = cx - totalCardsW / 2;
        const cardsY = 282;
        cards.forEach((c, i) => {
            statCard(doc, cardsStartX + i * (cardW + cardGap), cardsY, cardW, cardH, c.value, c.label, c.icon);
        });
        // ── Footer ───────────────────────────────────────────────────────────
        const footerY = 428;
        // Divider line
        doc.lineWidth(0.7).strokeColor(CARD_BORDER);
        doc.moveTo(80, footerY).lineTo(W - 80, footerY).stroke();
        // Small diamond accent at the divider center
        const diamondY = footerY;
        doc.save();
        doc.fillOpacity(1).fillColor(SECONDARY);
        doc.translate(cx, diamondY).rotate(45);
        doc.rect(-3, -3, 6, 6).fill();
        doc.restore();
        const fy = footerY + 26;
        // Left: Date of Completion
        const completionDate = cert.completionDate
            ? formatCertificateDate(new Date(cert.completionDate))
            : formatCertificateDate(new Date());
        doc.font('Helvetica').fontSize(8).fillColor(MUTED)
            .text('Date of Completion', 80, fy, { characterSpacing: 1 });
        doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY)
            .text(completionDate, 80, fy + 14);
        // Center: Certificate ID
        doc.font('Helvetica').fontSize(8).fillColor(MUTED)
            .text('Certificate ID', 0, fy, { width: W, align: 'center', characterSpacing: 1 });
        doc.font('Helvetica-Bold').fontSize(12).fillColor(PRIMARY)
            .text(cert.certificateId, 0, fy + 13, { width: W, align: 'center' });
        // Right: Authorized signature
        const sigW = 220;
        const sigX = W - 80 - sigW;
        doc.font(scriptFont).fontSize(21).fillColor(NAVY)
            .text('Typeoye Team', sigX, fy - 4, { width: sigW, align: 'right' });
        doc.moveTo(sigX, fy + 26).lineTo(W - 80, fy + 26)
            .lineWidth(0.8).strokeColor(SECONDARY).stroke();
        doc.font('Helvetica').fontSize(8).fillColor(MUTED)
            .text('AUTHORIZED SIGNATURE', sigX, fy + 32, { width: sigW, align: 'right', characterSpacing: 1 });
        // Optional verification line (rendered only when the platform provides a URL)
        if (cert.verificationUrl) {
            doc.font('Helvetica').fontSize(8).fillColor(MUTED)
                .text(`Verify this certificate at ${cert.verificationUrl}`, 0, 512, {
                width: W,
                align: 'center',
                characterSpacing: 0.3,
            });
        }
        doc.end();
    });
}
//# sourceMappingURL=certificate.service.js.map