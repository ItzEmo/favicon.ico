import "server-only"

import { neon } from "@neondatabase/serverless"
import { Pool } from "pg"

// Better Auth needs a real pg Pool for users, sessions, and accounts.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Shared Neon SQL tagged-template client for the live queue.
// The queue is public (no per-user scoping) so a single client is enough.
export const sql = neon(process.env.DATABASE_URL as string)
