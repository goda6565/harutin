---
title: "Deploying Astro to Cloudflare Workers"
description: "A step-by-step guide for deploying an Astro static site to Cloudflare using Workers Builds (CI/CD)."
pubDate: 2026-01-25
tags: ["astro", "cloudflare", "ci/cd"]
author: "harutin"
---

## Overview

This post covers how to deploy an Astro static site to Cloudflare using Workers Builds.

## Prerequisites

- An Astro project
- A Cloudflare account
- A GitHub repository

## Step 1: Install Wrangler

```bash
pnpm add -D wrangler
```

## Step 2: Configure wrangler.jsonc

Create a `wrangler.jsonc` file in your project root:

```json
{
  "name": "your-project-name",
  "compatibility_date": "your-compatibility-date",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

Key settings:
- `name`: Your project name on Cloudflare
- `assets.directory`: Astro's build output directory
- `not_found_handling`: Enables serving your custom 404 page

## Step 3: Set Up Cloudflare Workers Builds

1. Log in to the Cloudflare dashboard
2. Navigate to **Workers & Pages** → **Create**
3. Select **Import a repository** and connect your GitHub account
4. Choose your Astro project repository

## Step 4: Configure Build Settings

Set the following in the build configuration:

| Setting | Value |
|---------|-------|
| Build command | `npx astro build` |
| Deploy command | `npx wrangler deploy` |

## Step 5: Push to GitHub

When you push to GitHub, Cloudflare Workers will automatically build and deploy your site.

Your site will be available at `your-project-name.workers.dev`. That's it!

## References

- [Deploy your Astro Site to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/)
