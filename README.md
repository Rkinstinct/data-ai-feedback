# data-ai-feedback — שאלון משוב אנונימי

Anonymous course-feedback site (Ariel DATA & AI course): 1-5 smiley ratings per
instructor/topic + free-text comments, fully anonymous, with a password-protected
admin dashboard (admin.html).

- Frontend: static HTML/CSS/JS on GitHub Pages.
- Backend: Cloudflare Worker `feedback-api` + D1 (`feedback-db`) on the ariel-crm account.
- Anonymity by design: the backend stores only the answer fields — no name, email,
  IP, user-agent or timestamps.

כל הזכויות שמורות לראובן קזורר
