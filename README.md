# AabraKaDabra Resume

Paste any job description and conjure an **ATS-friendly Word resume** written for that job.

## How it works

1. **Paste the job description.** Copy it from any job board or careers page, along with the job title (and company, optionally).
2. **Analyze the description.** It splits the posting into responsibilities, requirements, and nice-to-haves. It also extracts about 400 known skills and keywords, picks up unknown acronyms and tools, and detects required years, seniority, education, and certifications.
3. **Write the resume.**
   - **Summary:** uses the exact job title, your years of experience, and the top keywords.
   - **Skills:** grouped by category and containing every keyword from the posting.
   - **Experience bullets:** rewritten from the job's duties into past-tense achievement statements.
   - **Keyword check:** any keyword the resume still lacks is added automatically, aiming for 100% keyword coverage.
4. **Review and download.** Edit anything in the browser, then download a `.docx`. Any information you haven't filled in, such as name, education, employers, or dates, is shown as a **yellow-highlighted `[placeholder]`**.

### ATS-friendly formatting
Single column. No tables, text boxes, images, or header/footer content. Uses standard section names (Professional Summary, Skills, Professional Experience, Education, Certifications), real Word bullets, Calibri font, and a choice of A4 or Letter page size.

## Run locally

The app is a static site: everything (analysis and `.docx` generation) runs in the browser. Requires Node.js 20.12 or later to build.

```bash
npm install
npm run dev        # http://localhost:5173
npm test
npm run build      # outputs static files to dist/
```

## Deploy to GitHub Pages

1. Push this folder as the root of a GitHub repository (branch `main` or `master`).
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds the site and publishes `dist/` on every push. The site appears at `https://<user>.github.io/<repo>/`.

## Honesty note

The generated bullets describe what the job asks for. Before applying, review every line and keep only what reflects your real experience.
