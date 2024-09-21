# 🚀 OpenCharacter: An Open Source Alternative to Character.ai

**_Create and run any characters locally with local models or use the hosted version._**

## The stack includes:

- [Next.js](https://nextjs.org/) for frontend
- [TailwindCSS](https://tailwindcss.com/) for styling
- [Drizzle ORM](https://orm.drizzle.team/) for database access
- [NextAuth](https://next-auth.js.org/) for authentication
- [Cloudflare D1](https://www.cloudflare.com/developer-platform/d1/) for serverless databases
- [Cloudflare Pages](https://pages.cloudflare.com/) for hosting
- [ShadcnUI](https://shadcn.com/) as the component library

## Getting Started

1. Make sure that you have [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/#installupdate-wrangler) installed. And also that you have logged in with `wrangler login` (You'll need a Cloudflare account)

2. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/Dhravya/cloudflare-saas-stack
   cd cloudflare-saas-stack
   npm i -g bun
   bun install
   bun run setup
   ```

3. Run the development server:
   ```bash
   bun run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Cloudflare Integration

Besides the `dev` script, `c3` has added extra scripts for Cloudflare Pages integration:
- `pages:build`: Build the application for Pages using [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages) CLI
- `preview`: Locally preview your Pages application using [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI
- `deploy`: Deploy your Pages application using Wrangler CLI

> __Note:__ While the `dev` script is optimal for local development, you should preview your Pages application periodically to ensure it works properly in the Pages environment.

## Bindings

Cloudflare [Bindings](https://developers.cloudflare.com/pages/functions/bindings/) allow you to interact with Cloudflare Platform resources. You can use bindings during development, local preview, and in the deployed application.

For detailed instructions on setting up bindings, refer to the Cloudflare documentation.

## Database Migrations

To apply database migrations:
- For development: `bun run migrate:dev`
- For production: `bun run migrate:prd`

## Cloudflare R2 Bucket CORS / File Upload

Don't forget to add the CORS policy to the R2 bucket. The CORS policy should look like this:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT"
    ],
    "AllowedHeaders": [
      "Content-Type"
    ],
    "ExposeHeaders": [
      "ETag"
    ]
  }
]
```

### Using OpenRouter

To integrate OpenCharacter with OpenRouter, you must configure your OpenRouter API key. To do this, add the following environment variable:
```bash
OPENROUTER_API_KEY="your_openrouter_api_key_here"
```
This can be done in your `.env` file for local development or in your Cloudflare Pages environment variables for production.

With this setup, you can also enable object upload capabilities.

## Manual Setup

If you prefer manual setup:

1. Create a Cloudflare account and install Wrangler CLI.
2. Create a D1 database: `bunx wrangler d1 create ${dbName}`
3. Create a `.dev.vars` file in the project root with your Google OAuth credentials and NextAuth secret.
4. Run local migration: `bunx wrangler d1 execute ${dbName} --local --file=migrations/0000_setup.sql`
5. Run remote migration: `bunx wrangler d1 execute ${dbName} --remote --file=migrations/0000_setup.sql`
6. Start development server: `bun run dev`
7. Deploy: `bun run deploy`

## The Beauty of This Stack

- Fully scalable and composable
- No environment variables needed (use `env.DB`, `env.KV`, `env.Queue`, `env.AI`, etc.)
- Powerful tools like Wrangler for database management and migrations
- Cost-effective scaling (e.g., $5/month for multiple high-traffic projects)

Just change your Cloudflare account ID in the project settings, and you're good to go!

