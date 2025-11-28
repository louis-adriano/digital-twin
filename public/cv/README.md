# CV Directory

This directory contains the static CV file used in production.

## Production Setup

Place your CV file as `resume.pdf` in this directory. This file will be served when the CV download is requested in production environments where uploaded files are not available.

## File Requirements

- Filename: `resume.pdf` (or `resume.docx`)
- Supported formats: PDF (recommended) or DOCX
- This file is committed to the repository and deployed with the application

## Note

In development, the application will first try to use dynamically uploaded CVs from `public/uploads/cv/`. If not found, it falls back to this static file.
