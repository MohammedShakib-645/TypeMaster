/**
 * TypeMaster - Certificate Generator
 * Generates beautiful printable typing certificates with user name
 * and issued by Mohammed Shakib (TypeMaster Academy)
 */

const CertificateEngine = {
    
    /**
     * Generate and display a certificate for a milestone
     * @param {string} userName - User's display name
     * @param {string} certType - 'beginner' | 'intermediate' | 'advanced' | 'master' | 'custom'
     * @param {object} stats - { wpm, accuracy, lessonsCompleted, date }
     */
    generate(userName, certType, stats = {}) {
        const certId = 'TM-' + Date.now().toString(36).toUpperCase();
        const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const certInfo = this._getCertInfo(certType, stats);
        const html = this._buildCertHTML(userName, certId, issueDate, certInfo, stats);

        const win = window.open('', '_blank', 'width=1000,height=750');
        if (!win) { alert('Please allow popups to view your certificate.'); return; }
        win.document.write(html);
        win.document.close();
    },

    _getCertInfo(type, stats) {
        const wpm = stats.wpm || 0;
        const lessons = stats.lessonsCompleted || 0;

        const types = {
            beginner: {
                title: 'Certificate of Achievement',
                subtitle: 'Beginner Typing Proficiency',
                achievement: 'Successfully completing the Beginner Typing Curriculum',
                badge: '🥉',
                borderColor: '#22C55E',
                gradientStart: '#064e3b',
                gradientEnd: '#0f172a'
            },
            intermediate: {
                title: 'Certificate of Proficiency',
                subtitle: 'Intermediate Typing Mastery',
                achievement: 'Demonstrating intermediate-level touch typing proficiency',
                badge: '🥈',
                borderColor: '#3B82F6',
                gradientStart: '#1e3a8a',
                gradientEnd: '#0f172a'
            },
            advanced: {
                title: 'Certificate of Excellence',
                subtitle: 'Advanced Typing Excellence',
                achievement: 'Achieving advanced touch typing skills with high accuracy and speed',
                badge: '🥇',
                borderColor: '#F59E0B',
                gradientStart: '#78350f',
                gradientEnd: '#1a0c18'
            },
            master: {
                title: 'Master Typing Certificate',
                subtitle: 'TypeMaster Elite Certification',
                achievement: 'Mastering the complete TypeMaster curriculum with outstanding results',
                badge: '👑',
                borderColor: '#8B5CF6',
                gradientStart: '#4c1d95',
                gradientEnd: '#0f172a'
            },
            custom: {
                title: 'Certificate of Completion',
                subtitle: 'TypeMaster Typing Assessment',
                achievement: `Completing a comprehensive typing assessment with ${wpm} WPM`,
                badge: '⚡',
                borderColor: '#3B82F6',
                gradientStart: '#1e3a8a',
                gradientEnd: '#0f172a'
            }
        };

        return types[type] || types.custom;
    },

    _buildCertHTML(userName, certId, issueDate, info, stats) {
        const wpm = stats.wpm || 0;
        const accuracy = stats.accuracy || 0;
        const lessons = stats.lessonsCompleted || 0;
        const level = stats.level || 'Typist';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>TypeMaster Certificate - ${userName}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@400;500;600;700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: 'Inter', sans-serif;
            background: #0a0a1a;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px 20px;
        }

        .cert-actions {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
        }

        .cert-btn {
            padding: 10px 24px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .cert-btn-print {
            background: ${info.borderColor};
            color: #fff;
        }

        .cert-btn-close {
            background: rgba(255,255,255,0.1);
            color: #fff;
            border: 1px solid rgba(255,255,255,0.2);
        }

        /* ─── CERTIFICATE ─── */
        .certificate {
            width: 900px;
            max-width: 100%;
            background: linear-gradient(145deg, ${info.gradientStart} 0%, ${info.gradientEnd} 100%);
            border: 3px solid ${info.borderColor};
            border-radius: 20px;
            padding: 0;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 60px rgba(${parseInt(info.borderColor.slice(1,3),16)}, ${parseInt(info.borderColor.slice(3,5),16)}, ${parseInt(info.borderColor.slice(5,7),16)}, 0.4);
        }

        /* Corner ornaments */
        .cert-corner {
            position: absolute;
            width: 80px; height: 80px;
            border-color: ${info.borderColor};
            border-style: solid;
            opacity: 0.6;
        }
        .cert-corner.tl { top: 10px; left: 10px; border-width: 3px 0 0 3px; border-radius: 8px 0 0 0; }
        .cert-corner.tr { top: 10px; right: 10px; border-width: 3px 3px 0 0; border-radius: 0 8px 0 0; }
        .cert-corner.bl { bottom: 10px; left: 10px; border-width: 0 0 3px 3px; border-radius: 0 0 0 8px; }
        .cert-corner.br { bottom: 10px; right: 10px; border-width: 0 3px 3px 0; border-radius: 0 0 8px 0; }

        /* Inner border */
        .cert-inner {
            margin: 20px;
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 14px;
            padding: 48px 60px;
        }

        /* Background pattern */
        .certificate::before {
            content: '⌨';
            position: absolute;
            font-size: 400px;
            opacity: 0.025;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            color: white;
        }

        .cert-header {
            text-align: center;
            margin-bottom: 32px;
            position: relative;
        }

        .cert-brand {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 16px;
        }

        .cert-brand-icon {
            font-size: 36px;
            filter: drop-shadow(0 0 10px ${info.borderColor});
        }

        .cert-brand-name {
            font-family: 'Cinzel', serif;
            font-size: 26px;
            font-weight: 700;
            color: ${info.borderColor};
            letter-spacing: 4px;
            text-transform: uppercase;
        }

        .cert-badge { font-size: 56px; margin-bottom: 8px; }

        .cert-title {
            font-family: 'Cinzel', serif;
            font-size: 34px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 2px;
            margin-bottom: 6px;
        }

        .cert-subtitle {
            font-size: 16px;
            color: ${info.borderColor};
            font-weight: 600;
            letter-spacing: 3px;
            text-transform: uppercase;
        }

        .cert-divider {
            border: none;
            height: 1px;
            background: linear-gradient(90deg, transparent, ${info.borderColor}, transparent);
            margin: 28px 0;
            opacity: 0.6;
        }

        .cert-body { text-align: center; }

        .cert-present-text {
            font-size: 14px;
            color: rgba(255,255,255,0.6);
            text-transform: uppercase;
            letter-spacing: 4px;
            margin-bottom: 16px;
        }

        .cert-name {
            font-family: 'Dancing Script', cursive;
            font-size: 58px;
            color: #ffffff;
            margin-bottom: 8px;
            text-shadow: 0 0 30px rgba(255,255,255,0.4);
            line-height: 1.1;
        }

        .cert-achievement {
            font-size: 15px;
            color: rgba(255,255,255,0.7);
            margin-bottom: 8px;
            font-style: italic;
        }

        .cert-achievement-detail {
            font-size: 16px;
            color: rgba(255,255,255,0.9);
            font-weight: 600;
            max-width: 600px;
            margin: 0 auto 28px;
            line-height: 1.6;
        }

        .cert-stats-row {
            display: flex;
            justify-content: center;
            gap: 32px;
            margin: 24px 0;
            flex-wrap: wrap;
        }

        .cert-stat-box {
            text-align: center;
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 12px;
            padding: 14px 24px;
            min-width: 110px;
        }

        .cert-stat-val {
            font-size: 28px;
            font-weight: 900;
            color: ${info.borderColor};
        }

        .cert-stat-lbl {
            font-size: 11px;
            color: rgba(255,255,255,0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 4px;
        }

        .cert-footer {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-top: 36px;
            align-items: end;
        }

        .cert-sign-block { text-align: center; }

        .cert-sign-line {
            border-top: 1px solid rgba(255,255,255,0.3);
            padding-top: 10px;
            margin-top: 32px;
        }

        .cert-sign-name {
            font-family: 'Dancing Script', cursive;
            font-size: 28px;
            color: white;
        }

        .cert-sign-role {
            font-size: 11px;
            color: rgba(255,255,255,0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 2px;
        }

        .cert-id-block { text-align: center; }

        .cert-id-seal {
            width: 70px;
            height: 70px;
            border: 2px solid ${info.borderColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            margin: 0 auto 8px;
            box-shadow: 0 0 20px ${info.borderColor}44;
        }

        .cert-id-text {
            font-size: 10px;
            color: rgba(255,255,255,0.4);
            font-family: monospace;
            word-break: break-all;
        }

        @media print {
            body { background: white; padding: 0; }
            .cert-actions { display: none; }
            .certificate {
                box-shadow: none;
                border: 2px solid ${info.borderColor};
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="cert-actions">
        <button class="cert-btn cert-btn-print" onclick="window.print()">🖨️ Print Certificate</button>
        <button class="cert-btn cert-btn-close" onclick="window.close()">✕ Close</button>
    </div>

    <div class="certificate">
        <!-- Corner ornaments -->
        <div class="cert-corner tl"></div>
        <div class="cert-corner tr"></div>
        <div class="cert-corner bl"></div>
        <div class="cert-corner br"></div>

        <div class="cert-inner">
            <!-- Header -->
            <div class="cert-header">
                <div class="cert-brand">
                    <span class="cert-brand-icon">⚡</span>
                    <span class="cert-brand-name">TypeMaster Academy</span>
                </div>
                <div class="cert-badge">${info.badge}</div>
                <h1 class="cert-title">${info.title}</h1>
                <div class="cert-subtitle">${info.subtitle}</div>
            </div>

            <hr class="cert-divider">

            <!-- Body -->
            <div class="cert-body">
                <div class="cert-present-text">This certifies that</div>
                <div class="cert-name">${userName}</div>
                <div class="cert-achievement">has successfully demonstrated excellence by</div>
                <div class="cert-achievement-detail">${info.achievement}</div>

                <!-- Stats Row -->
                <div class="cert-stats-row">
                    ${wpm ? `<div class="cert-stat-box"><div class="cert-stat-val">${wpm}</div><div class="cert-stat-lbl">Best WPM</div></div>` : ''}
                    ${accuracy ? `<div class="cert-stat-box"><div class="cert-stat-val">${accuracy}%</div><div class="cert-stat-lbl">Accuracy</div></div>` : ''}
                    ${lessons ? `<div class="cert-stat-box"><div class="cert-stat-val">${lessons}</div><div class="cert-stat-lbl">Lessons</div></div>` : ''}
                    ${level ? `<div class="cert-stat-box"><div class="cert-stat-val">${level}</div><div class="cert-stat-lbl">Level Reached</div></div>` : ''}
                </div>
            </div>

            <hr class="cert-divider">

            <!-- Footer -->
            <div class="cert-footer">
                <div class="cert-sign-block">
                    <div class="cert-sign-line">
                        <div class="cert-sign-name">Mohammed Shakib</div>
                        <div class="cert-sign-role">Founder & Director<br>TypeMaster Academy</div>
                    </div>
                </div>

                <div class="cert-id-block">
                    <div class="cert-id-seal">🏛️</div>
                    <div class="cert-id-text">
                        Certificate ID<br>
                        <strong style="color:rgba(255,255,255,0.7)">${certId}</strong><br>
                        Issued: ${issueDate}
                    </div>
                </div>

                <div class="cert-sign-block">
                    <div class="cert-sign-line">
                        <div class="cert-sign-name" style="font-size:20px;font-family:Inter,sans-serif;font-weight:700;">TypeMaster</div>
                        <div class="cert-sign-role">Online Learning Platform<br>typemaster.academy</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
    }
};
