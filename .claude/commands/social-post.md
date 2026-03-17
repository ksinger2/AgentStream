---
description: Create and post social media content about the project
---

# /social-post — Social Media Content Creation & Posting

You are creating and posting social media content about the project. Follow these steps.

## 1. Gather Context

Read these files to understand what to post about:
- `CHANGELOG.md` — Recent releases and features
- `Features.md` — Current feature status
- `git log --oneline -20` — Recent development activity
- `CLAUDE.md` — Project overview and description

## 2. Determine Content

If the user specified a topic, platform, or tone — use that.

Otherwise, suggest content options:
- **Release announcement**: New version highlights
- **Feature spotlight**: Deep dive on a specific feature
- **Development update**: Behind-the-scenes progress
- **Technical insight**: Interesting technical decisions or patterns
- **Milestone celebration**: User count, performance improvements, etc.

Ask the user which type of content they want (unless already specified).

## 3. Generate Drafts

Launch **social-strategist** with:
- Project context from step 1
- Content type and topic from step 2
- Target platform(s) (Twitter/X, LinkedIn, Reddit, etc.)
- Tone guidance (professional, casual, technical, exciting)

The social-strategist should generate 2-3 draft options per platform.

## 4. Review & Approve

Present drafts to the user. For each draft show:
- Platform
- Character count
- The post content
- Suggested hashtags
- Suggested media (screenshot, GIF, etc.)

**Wait for user approval before posting.**

## 5. Post

After approval, the social-strategist posts via Playwright automation:
- Navigate to the platform
- Post the approved content
- Take a screenshot as verification
- Return the post URL

## 6. Optional: Recurring Schedule

If the user wants recurring posts, use `CronCreate` to schedule content generation:
- Default: weekly content suggestions
- The cron job generates drafts and presents for approval (never auto-posts without approval)
- Reminder: CronCreate jobs expire after 3 days — re-run in new sessions
