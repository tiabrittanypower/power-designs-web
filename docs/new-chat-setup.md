# Power Designs Web: new chat and environment setup

Use this when you start a fresh Claude Code chat for Power Designs Web. It has three parts: environment settings, a setup script, and a CLAUDE.md that gives every new chat the brand rules.

## 1. Environment settings

Open the cloud environment menu in the session title bar, choose Edit, and set:

| Setting | Value |
|---|---|
| Name | Power Designs Web |
| Repository | tiabrittanypower/power-designs-web (default branch main) |
| Network access | Limited, with "Allow package managers" ticked, plus the allowed domains below |
| Setup script | The script in section 2 |

Allowed domains (add one per line):

```
srv2120-files.hstgr.io
powerdesign.co.za
fonts.googleapis.com
fonts.gstatic.com
raw.githubusercontent.com
```

- `srv2120-files.hstgr.io` lets Claude upload files to Hostinger. This host can change for your account; if an upload is blocked, the error names the host to add.
- `powerdesign.co.za` lets Claude check the live site.
- The other three let Claude render pages with the brand fonts and install the fonts.

Environment variables (not secret):

```
TZ=Africa/Johannesburg
LANG=en_ZA.UTF-8
PDW_DOMAIN=powerdesign.co.za
PDW_EMAIL=info@powerdesign.co.za
PDW_WHATSAPP=27500504340
```

Secrets: store none here. Your manual says passwords, API keys and client personal data never go into chat or external tools. The Setup script cannot read saved variables or secrets anyway. Connect Hostinger, Google Drive and GitHub through claude.ai connectors instead.

## 2. Setup script

Paste this into the Setup script box. It is safe to run twice, and every optional step ends with `|| true` so a blocked download never stops the session.

```bash
#!/usr/bin/env bash
# Power Designs Web: environment setup
set -u

# Tools for documents, images and PDFs
apt-get update -qq || true
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends \
  poppler-utils imagemagick librsvg2-bin fonts-liberation unzip zip \
  libreoffice-writer || true

# Python libraries used for the manuals, logos and print PDFs
pip install -q --disable-pip-version-check \
  python-docx fonttools reportlab svglib pillow || true

# Brand fonts (Manrope headings, DM Sans body). Best effort.
mkdir -p "$HOME/.fonts"
curl -fsSL -o "$HOME/.fonts/Manrope.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf" || true
curl -fsSL -o "$HOME/.fonts/DMSans.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf" || true
fc-cache -f >/dev/null 2>&1 || true

# Working folders outside the repo
mkdir -p /tmp/pdw-work

echo "Power Designs Web environment ready"
```

## 3. CLAUDE.md for the repo

Save this as `CLAUDE.md` in the repo root so every new chat starts with the same rules.

```markdown
# Power Designs Web

Web design studio for small businesses. Owner: Tia Power, Operations Manager. Live site: https://powerdesign.co.za (Hostinger). Contact: info@powerdesign.co.za, WhatsApp +27 50 050 4340.

## Rules that always apply
- The live Hostinger site is the source of truth. Never deploy the Git repo over it: that deletes live-only pages (the /us/ section, region.js, 404.html) and the subdomain folders. Copy live to Git, not Git to live.
- Nothing is sent, published, posted or paid for without Tia's yes. Drafts only.
- Never put passwords, API keys, client personal data or confidential documents into chat or files.
- Email is always info@powerdesign.co.za. The domain is powerdesign.co.za (singular). Never use powerdesigns.co.za.
- Never invent testimonials, reviews, statistics or sales numbers. No ranking or approval guarantees.

## Brand
- Colours: navy #071A3D, electric blue #246BFE, gold #F6B73C (accent), coral #FF5A55 (logo square only). Neutrals: #F5F7FB, #DBE3F0, #5E6B82, #12213D, white.
- Fonts: Manrope (headings), DM Sans (body). Fallback Arial.
- Tagline: Your business is real. Let's make it look the part.
- Voice: plain, warm, direct. Sentence case. South African English (en-ZA). Prices as R3,990 once-off, No VAT.
- Packages: Launch R3,990 (3 pages), Grow R6,990 (5 pages), Lead R11,990 (10 pages), Serve R12,990 (restaurants). Care R249, Support R499, Priority R899 a month.
- Max five hashtags per caption: #PowerDesignsWeb #SmallBusinessSA #WebDesignSouthAfrica #SmallBusinessWebsite

## Where things are
- brand-kit/: logos, social images, manuals, colour and font reference.
- docs/: brand manual v1.3, Corporate Brand Standards and Identity Manual, assets zip, Done and Cant Do lists.
- assets/: logos used by the website.

## Known limits
- Hostinger file uploads need srv2120-files.hstgr.io allowed in the environment network settings.
- Social accounts (Facebook, Instagram, WhatsApp, Meta Insights) cannot be reached from here.
```
