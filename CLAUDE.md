# Commit messages

This repo is public on GitHub. Do not include the `Claude-Session:` trailer
line in commit messages here. `Co-Authored-By: Claude ...` is fine to keep.

## Rendering / Build

Never construct dates with `new Date('YYYY-MM-DD')` or any parser that applies UTC-to-local conversion for date-only strings. Format resume/report dates from the literal string components. After any render pipeline change, diff the rendered output dates against resume.json before declaring done.

## Writing Style

All resume and cover letter bullets must start with the '•' character. Match the tone and formatting of the existing document before drafting new content; show a one-bullet sample for approval before generating a full section.
