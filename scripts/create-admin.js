// Creates a test account with email already verified and role='admin' —
// for local testing only. Requires SUPABASE_SERVICE_ROLE_KEY (see .env.example),
// which must NEVER be used in the frontend or committed to git.
//
// Usage:
//   node scripts/create-admin.js [email] [password] [fullName] [phone]
// Defaults to the test account details already agreed on if no args given.

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your .env file. ' +
      'Get the service role key from Supabase > Project Settings > API (the "service_role" secret).'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const [, , emailArg, passwordArg, fullNameArg, phoneArg] = process.argv
const email = emailArg || 'txnybeat@gmail.com'
const password = passwordArg || 'example@1'
const full_name = fullNameArg || 'example'
const phone = phoneArg || '0769334328'

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skips the verification email — fine for a test account
  })

  if (error) {
    console.error('Failed to create user:', error.message)
    process.exit(1)
  }

  // A database trigger already created a 'customer' profile row the moment
  // the user was created above — update it to admin rather than inserting again.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name, phone, role: 'admin' })
    .eq('id', data.user.id)

  if (profileError) {
    console.error('User was created but the profile insert failed:', profileError.message)
    console.error(`You can finish manually: update profiles set role='admin' where id='${data.user.id}';`)
    process.exit(1)
  }

  console.log(`✅ Admin test account ready — log in with ${email} / ${password}`)
}

main()
