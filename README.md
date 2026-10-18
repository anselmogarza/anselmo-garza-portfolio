# Anselmo Garza | QA Portfolio

A professional portfolio with an interactive Quality Lab and an Incident Desk
case study, showcasing QA automation, troubleshooting, and release engineering.

Public portfolio: https://anselmogarza.github.io/anselmo-garza-portfolio/

PDF CV: https://anselmogarza.github.io/anselmo-garza-portfolio/Anselmo_Garza_CV.pdf

## View locally

Open `quality-lab/dist/index.html` in your browser. The site uses plain HTML,
CSS, and JavaScript; no installation or build step is required.

## Interactive demo

1. Run the order-save check to reproduce a race condition.
2. Inspect the event timeline to see success reported before persistence.
3. Open **The fix** and apply the ordering change.
4. Verify the fix using the same check.

The application and incident are fictional browser simulations. They do not
execute C#, Playwright, or database operations.

The linked Migration Workshop compares simplified Selenium-style and intended
async framework excerpts, explains observation retries, and maps coverage and
verification gaps. It is a source-review case, not an executed migration test.

## Verification

With Node.js installed, run from the repository root:

```sh
node --check quality-lab/dist/app.js
node quality-lab/check-demo.cjs
node quality-lab/build-cv.cjs
node quality-lab/check-site.cjs
```

The automated check covers failing and corrected event ordering, verification,
and reset during execution. It uses a lightweight DOM substitute; it does not
replace browser testing for layout or accessibility.

## Project layout

- `quality-lab/dist/` — website source and downloadable CV
- `quality-lab/check-demo.cjs` — interaction checks
- `quality-lab/build-cv.cjs` — regenerates the PDF from the plain-text CV
- `quality-lab/.openai/hosting.json` — Sites deployment configuration

The deployment archive is generated output and is excluded from Git.
See [project notes](quality-lab/README.md) for content and hosting details.

## Sharing your CV

Attach `quality-lab/dist/Anselmo_Garza_CV.pdf` to recruiter emails. It includes
clickable email and portfolio links. The website offers PDF and plain-text
downloads. The GitHub Pages deployment is public and requires no visitor
account. The separate ChatGPT Sites deployment remains private.

## GitHub Pages deployment

`.github/workflows/pages.yml` validates the demo, regenerates the PDF, checks
local links, and publishes only `quality-lab/dist/` on pushes to `main`.
The repository must be public for GitHub Free hosting. In repository settings,
select **Pages > Build and deployment > Source > GitHub Actions**.
No custom domain, paid plan, or server is required.

## Content review

The portfolio and CV reflect confirmed Epicor role dates, four-person team
leadership since May 2026, migration framework ownership, approximately 50%
shorter suite execution times with unchanged scope, and AI-assisted QA workflows.
Company benchmark documents and internal artifacts are not included.

Confirm official English degree wording before formal applications. Browser
visual verification is still outstanding.
