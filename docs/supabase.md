TITLE: Initializing Supabase Client - JavaScript
DESCRIPTION: Initializes the Supabase client in JavaScript using the provided project URL and anonymous public API key. This client instance is used for all subsequent Supabase interactions.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/realtime/broadcast.mdx#_snippet_0

LANGUAGE: JavaScript
CODE:

```
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://<project>.supabase.co'
const SUPABASE_KEY = '<your-anon-key>'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
```

---

TITLE: Basic SQL DML Operations with WHERE Clause
DESCRIPTION: Demonstrates fundamental SQL Data Manipulation Language (DML) operations including SELECT, UPDATE, and DELETE, showing how to use the WHERE clause to target specific rows in a table. These operations are essential for interacting with data in a relational database.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/troubleshooting/rls-simplified-BJTcS8.mdx#_snippet_0

LANGUAGE: SQL
CODE:

```
-- select
select *
from some_table
where id = 5;

-- update
update some_table
set id = 6
where id = 5;

-- delete
delete from some_table
where id = 6;
```

---

TITLE: Defining Row Level Security Policies in Supabase SQL
DESCRIPTION: This SQL block enables Row Level Security (RLS) for the `users`, `groups`, and `messages` tables, and then defines specific access policies. It allows all users to read user emails and group data, while restricting group creation, message reading, and message creation to authenticated users only. Group owners are also granted permission to delete their own groups, enhancing data security and access control.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2022-11-08-authentication-in-ionic-angular.mdx#_snippet_1

LANGUAGE: SQL
CODE:

```
-- Secure tables
alter table users enable row level security;
alter table groups enable row level security;
alter table messages enable row level security;

-- User Policies
create policy "Users can read the user email." on users
  for select using (true);

-- Group Policies
create policy "Groups are viewable by everyone." on groups
  for select using (true);

create policy "Authenticated users can create groups." on groups for
  insert to authenticated with check (true);

create policy "The owner can delete a group." on groups for
    delete using ((select auth.uid()) = creator);

-- Message Policies
create policy "Authenticated users can read messages." on messages
  for select to authenticated using (true);

create policy "Authenticated users can create messages." on messages
  for insert to authenticated with check (true);
```

---

TITLE: Creating User Profiles Table and Enabling RLS - Supabase SQL
DESCRIPTION: This snippet defines the 'profiles' table to store public user information, linked to 'auth.users'. It includes constraints for username length and then enables Row Level Security (RLS) on the table, which is crucial for fine-grained access control.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/_partials/user_management_quickstart_sql_template.mdx#_snippet_0

LANGUAGE: SQL
CODE:

```
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);
alter table profiles
  enable row level security;
```

---

TITLE: Configuring Supabase Database Schema for User Profiles (SQL)
DESCRIPTION: This SQL script defines the 'profiles' table for user data, sets up row-level security policies to control access, enables Realtime updates for the 'profiles' table, and configures a storage bucket named 'avatars' with public access policies for image uploads. It ensures users can manage their own profiles and avatars securely.
SOURCE: https://github.com/supabase/supabase/blob/master/examples/user-management/swift-user-management/README.md#_snippet_0

LANGUAGE: SQL
CODE:

```
-- Create a table for public "profiles"
create table profiles (
  id uuid references auth.users not null,
  updated_at timestamp with time zone,
  username text unique,
  avatar_url text,
  website text,

  primary key (id),
  unique(username),
  constraint username_length check (char_length(username) >= 3)
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( (select auth.uid()) = id );

create policy "Users can update own profile."
  on profiles for update
  using ( (select auth.uid()) = id );

-- Set up Realtime!
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;

-- Set up Storage!
insert into storage.buckets (id, name)
values ('avatars', 'avatars');

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );
```

---

TITLE: Initializing a Supabase Project Locally
DESCRIPTION: This command initializes a new Supabase project in the current directory, setting up the necessary local development environment files and configurations. It's the first step to begin working with Supabase locally.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/examples/elevenlabs-generate-speech-stream.mdx#_snippet_0

LANGUAGE: bash
CODE:

```
supabase init
```

---

TITLE: Configuring Supabase Environment Variables
DESCRIPTION: This snippet shows how to set up environment variables for Supabase project URL and anonymous key, typically in a `.env` file, which are essential for connecting to your Supabase project.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/auth-helpers/remix.mdx#_snippet_1

LANGUAGE: Bash
CODE:

```
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

---

TITLE: Integrating Avatar Widget into Flutter Account Page
DESCRIPTION: This snippet demonstrates how to integrate the custom `Avatar` widget into the `AccountPage` to manage user profiles. It includes logic to fetch and display user data, update username and website, handle user sign-out, and crucially, update the `avatar_url` in the Supabase `profiles` table when a new avatar is uploaded via the `_onUpload` callback. The page also manages loading states and provides user feedback through snack bars.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-flutter.mdx#_snippet_13

LANGUAGE: Dart
CODE:

```
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:supabase_quickstart/components/avatar.dart';
import 'package:supabase_quickstart/main.dart';
import 'package:supabase_quickstart/pages/login_page.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final _usernameController = TextEditingController();
  final _websiteController = TextEditingController();

  String? _avatarUrl;
  var _loading = true;

  /// Called once a user id is received within `onAuthenticated()`
  Future<void> _getProfile() async {
    setState(() {
      _loading = true;
    });

    try {
      final userId = supabase.auth.currentSession!.user.id;
      final data =
          await supabase.from('profiles').select().eq('id', userId).single();
      _usernameController.text = (data['username'] ?? '') as String;
      _websiteController.text = (data['website'] ?? '') as String;
      _avatarUrl = (data['avatar_url'] ?? '') as String;
    } on PostgrestException catch (error) {
      if (mounted) context.showSnackBar(error.message, isError: true);
    } catch (error) {
      if (mounted) {
        context.showSnackBar('Unexpected error occurred', isError: true);
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  /// Called when user taps `Update` button
  Future<void> _updateProfile() async {
    setState(() {
      _loading = true;
    });
    final userName = _usernameController.text.trim();
    final website = _websiteController.text.trim();
    final user = supabase.auth.currentUser;
    final updates = {
      'id': user!.id,
      'username': userName,
      'website': website,
      'updated_at': DateTime.now().toIso8601String(),
    };
    try {
      await supabase.from('profiles').upsert(updates);
      if (mounted) context.showSnackBar('Successfully updated profile!');
    } on PostgrestException catch (error) {
      if (mounted) context.showSnackBar(error.message, isError: true);
    } catch (error) {
      if (mounted) {
        context.showSnackBar('Unexpected error occurred', isError: true);
      }
    }
    finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _signOut() async {
    try {
      await supabase.auth.signOut();
    } on AuthException catch (error) {
      if (mounted) context.showSnackBar(error.message, isError: true);
    } catch (error) {
      if (mounted) {
        context.showSnackBar('Unexpected error occurred', isError: true);
      }
    } finally {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginPage()),
        );
      }
    }
  }

  /// Called when image has been uploaded to Supabase storage from within Avatar widget
  Future<void> _onUpload(String imageUrl) async {
    try {
      final userId = supabase.auth.currentUser!.id;
      await supabase.from('profiles').upsert({
        'id': userId,
        'avatar_url': imageUrl,
      });
      if (mounted) {
        const SnackBar(
          content: Text('Updated your profile image!'),
        );
      }
    } on PostgrestException catch (error) {
      if (mounted) context.showSnackBar(error.message, isError: true);
    } catch (error) {
      if (mounted) {
        context.showSnackBar('Unexpected error occurred', isError: true);
      }
    }
    if (!mounted) {
      return;
    }

    setState(() {
      _avatarUrl = imageUrl;
    });
  }

  @override
  void initState() {
    super.initState();
    _getProfile();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
        children: [
          Avatar(
            imageUrl: _avatarUrl,
            onUpload: _onUpload,
          ),
          const SizedBox(height: 18),
          TextFormField(
            controller: _usernameController,
            decoration: const InputDecoration(labelText: 'User Name'),
          ),
          const SizedBox(height: 18),
          TextFormField(
            controller: _websiteController,
            decoration: const InputDecoration(labelText: 'Website'),
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: _loading ? null : _updateProfile,
            child: Text(_loading ? 'Saving...' : 'Update'),
          ),
          const SizedBox(height: 18),
          TextButton(onPressed: _signOut, child: const Text('Sign Out')),
        ],
      ),
    );
  }
}
```

---

TITLE: Implementing Email Notification Hook for Failed Attempts (SQL)
DESCRIPTION: Defines a PostgreSQL function `hook_notify_user_on_failed_attempts` that acts as a Supabase password verification hook. It records sign-in attempts, counts failed attempts within a day, and if a threshold is exceeded, fetches an email API key from Supabase Vault to send a security alert email via `pg_net`. Permissions are granted to `supabase_auth_admin` for execution and table access.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/auth-hooks/password-verification-hook.mdx#_snippet_7

LANGUAGE: sql
CODE:

```
create or replace function public.hook_notify_user_on_failed_attempts(event jsonb)
returns jsonb
language plpgsql
as $$
  declare
    user_id uuid;
    server_token text;
    user_email_address text;
    email_body jsonb;
    response_id int; -- Variable to store the response ID
    http_code int;
    error_message jsonb;
    attempt_count int;
    max_attempts int := 5; -- Set the threshold for failed attempts
  begin
    user_id := (event->>'user_id')::uuid;

    -- Record the attempt
    insert into public.password_sign_in_attempts (user_id, attempt_id, last_attempt_at, attempt_successful)
    values (user_id, (event->>'attempt_id')::uuid, now(), (event->>'valid')::boolean)
    on conflict (user_id, attempt_id)
    do update set last_attempt_at = now(), attempt_successful = (event->>'valid')::boolean;

    -- Check failed attempts and fetch user email
    select count(*), u.email into attempt_count, user_email_address
    from public.password_sign_in_attempts a
    join auth.users u on a.user_id = u.id
    where a.user_id = user_id and attempt_successful = false and last_attempt_at > (now() - interval '1 day');

    -- Notify user if the number of failed attempts exceeds the threshold
    if attempt_count >= max_attempts then
      -- Fetch the server token
      select decrypted_secret into server_token from vault.decrypted_secrets where name = 'my_api_key_name';

      -- Prepare the email body
      email_body := format('{
        "from": "yoursenderemail@example.com",
        "to": "%s",
        "subject": "Security Alert: Repeated Login Attempts Detected",
        "textbody": "We have detected repeated login attempts for your account. If this was not you, please secure your account.",
        "htmlbody": "<html><body><strong>Security Alert:</strong> We have detected repeated login attempts for your account. If this was not you, please secure your account.</body></html>",
        "messagestream": "outbound"
      }', user_email_address)::jsonb;

      -- Perform the HTTP POST request using Postmark
      select id into response_id from net.http_post(
        'https://api.youremailprovider.com/email',
        email_body,
        'application/json',
        array['Accept: application/json', 'X-Postmark-Server-Token: ' || server_token]
      );

      -- Fetch the response from net._http_response using the obtained id
      select status_code, content into http_code, error_message from net._http_response where id = response_id;

      -- Handle email sending errors
      if http_code is null or (http_code < 200 or http_code >= 300) then
        return jsonb_build_object(
          'error', jsonb_build_object(
            'http_code', coalesce(http_code, 0),
            'message', coalesce(error_message ->> 'message', 'error sending email')
          )
        );
      end if;
    end if;

    -- Continue with default behavior
    return jsonb_build_object('decision', 'continue');
  end;
$$;

-- Assign appropriate permissions
grant execute
  on function public.hook_notify_user_on_failed_attempts
  to supabase_auth_admin;

revoke execute
  on function public.hook_notify_user_on_failed_attempts
  from authenticated, anon, public;

grant all
  on table public.password_sign_in_attempts
  to supabase_auth_admin;

revoke all
```

---

TITLE: Creating Triggers for Automatic Embedding Generation in Postgres
DESCRIPTION: These SQL triggers automate the embedding generation process. embed_documents_on_insert queues an embedding job after a new document is inserted, while embed_documents_on_update does the same when title or content columns are modified, ensuring embeddings stay in sync asynchronously.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2025-04-01-automatic-embeddings.mdx#_snippet_3

LANGUAGE: SQL
CODE:

```
-- Trigger for insert events
create trigger embed_documents_on_insert
  after insert
  on documents
  for each row
  execute function util.queue_embeddings('embedding_input', 'embedding');

-- Trigger for update events
create trigger embed_documents_on_update
  after update of title, content -- must match the columns in embedding_input()
  on documents
  for each row
  execute function util.queue_embeddings('embedding_input', 'embedding');
```

---

TITLE: Regenerating Supabase Database Types (Bash)
DESCRIPTION: This command regenerates the TypeScript types for the local Supabase database schema. It outputs the generated types to registry/default/fixtures/database.types.ts, which is essential for maintaining type safety and autocompletion when interacting with the Supabase client in a TypeScript project.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/ui-library/README.md#_snippet_1

LANGUAGE: bash
CODE:

```
supabase gen types --local > registry/default/fixtures/database.types.ts
```

---

TITLE: Creating a SELECT Policy for User's Own Profile
DESCRIPTION: This policy restricts `SELECT` access on the `profiles` table, allowing users to view only their own profile. It achieves this by comparing the authenticated user's ID (`auth.uid()`) with the `user_id` column of the profile.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/postgres/row-level-security.mdx#_snippet_6

LANGUAGE: SQL
CODE:

```
create policy "User can see their own profile only."
on profiles
for select using ( (select auth.uid()) = user_id );
```

---

TITLE: Initialize Supabase Browser Client (client.ts)
DESCRIPTION: Initializes the Supabase client for use in browser environments or client-side components. It uses environment variables for the Supabase URL and anonymous key.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/server-side/nextjs.mdx#_snippet_14

LANGUAGE: TypeScript
CODE:

```
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabase
}
```

---

TITLE: Creating an INSERT Policy for User-Owned Profiles
DESCRIPTION: This SQL block sets up a `profiles` table, enables RLS, and then defines an `INSERT` policy. The policy ensures that only authenticated users can create a profile, and that the `user_id` they attempt to insert matches their own authenticated user ID, preventing unauthorized profile creation.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/postgres/row-level-security.mdx#_snippet_7

LANGUAGE: SQL
CODE:

```
create table profiles (
  id uuid primary key,
  user_id uuid references auth.users,
  avatar_url text
);

alter table profiles enable row level security;

create policy "Users can create a profile."
on profiles for insert
to authenticated                          -- the Postgres Role (recommended)
with check ( (select auth.uid()) = user_id );      -- the actual Policy
```

---

TITLE: Creating PL/pgSQL Function to Process Embedding Jobs
DESCRIPTION: This PL/pgSQL function, `util.process_embeddings`, reads messages from the 'embedding_jobs' queue in batches using `pgmq.read`. It groups these jobs into `batch_size` chunks and then iterates through each batch, invoking an Edge Function named 'embed' with the batch as its body. The function includes parameters for `batch_size`, `max_requests`, and `timeout_milliseconds` to control processing behavior and visibility timeouts for retries.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/automatic-embeddings.mdx#_snippet_6

LANGUAGE: PL/pgSQL
CODE:

```
create or replace function util.process_embeddings(
  batch_size int = 10,
  max_requests int = 10,
  timeout_milliseconds int = 5 * 60 * 1000 -- default 5 minute timeout
)
returns void
language plpgsql
as $$
declare
  job_batches jsonb[];
  batch jsonb;
begin
  with
    -- First get jobs and assign batch numbers
    numbered_jobs as (
      select
        message || jsonb_build_object('jobId', msg_id) as job_info,
        (row_number() over (order by 1) - 1) / batch_size as batch_num
      from pgmq.read(
        queue_name => 'embedding_jobs',
        vt => timeout_milliseconds / 1000,
        qty => max_requests * batch_size
      )
    ),
    -- Then group jobs into batches
    batched_jobs as (
      select
        jsonb_agg(job_info) as batch_array,
        batch_num
      from numbered_jobs
      group by batch_num
    )
  -- Finally aggregate all batches into array
  select array_agg(batch_array)
  from batched_jobs
  into job_batches;

  -- Invoke the embed edge function for each batch
  foreach batch in array job_batches loop
    perform util.invoke_edge_function(
      name => 'embed',
      body => batch,
      timeout_milliseconds => timeout_milliseconds
    );
  end loop;
end;
$$;
```

---

TITLE: Configuring RLS Policy with Custom Session Variable - SQL
DESCRIPTION: This SQL snippet enables Row Level Security (RLS) on the `document_sections` table and defines a policy allowing authenticated users to select only their own document sections. It uses a custom session variable, `app.current_user_id`, to identify the current user, casting it to `bigint` for comparison with `owner_id`.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/rag-with-permissions.mdx#_snippet_9

LANGUAGE: SQL
CODE:

```
-- enable row level security
alter table document_sections enable row level security;

-- setup RLS for select operations
create policy "Users can query their own document sections"
on document_sections for select to authenticated using (
  document_id in (
    select id
    from external.documents
    where owner_id = current_setting('app.current_user_id')::bigint
  )
);
```

---

TITLE: Initialize Supabase Client (Swift)
DESCRIPTION: This snippet demonstrates how to initialize the Supabase client in a Swift application. It requires your Supabase project URL and the 'anon' key. The client instance is created using the SupabaseClient class.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-swift.mdx#_snippet_0

LANGUAGE: Swift
CODE:

```
import Foundation
import Supabase

let supabase = SupabaseClient(
  supabaseURL: URL(string: "YOUR_SUPABASE_URL")!,
  supabaseKey: "YOUR_SUPABASE_ANON_KEY"
)
```

---

TITLE: Configuring Supabase Postgres Profiles Table, RLS, Realtime, and Storage
DESCRIPTION: This SQL script defines the `profiles` table with user-related information, establishes Row Level Security (RLS) policies to control data access based on user authentication, sets up Realtime capabilities for the `profiles` table, and initializes a storage bucket for user avatars. RLS policies ensure users can only view public profiles, insert their own, and update their own profile data.
SOURCE: https://github.com/supabase/supabase/blob/master/examples/user-management/solid-user-management/README.md#_snippet_3

LANGUAGE: sql
CODE:

```
-- Create a table for Public Profiles
create table
	profiles (
		id uuid references auth.users not null,
		updated_at timestamp
		with
			time zone,
			username text unique,
			avatar_url text,
			website text,
			primary key (id),
			unique (username),
			constraint username_length check (char_length(username) >= 3)
	);

alter table
	profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles for
select
	using (true);

create policy "Users can insert their own profile." on profiles for insert
with
	check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles for
update
	using ((select auth.uid()) = id);

-- Set up Realtime!
begin;

drop
	publication if exists supabase_realtime;

create publication supabase_realtime;

commit;

alter
	publication supabase_realtime add table profiles;

-- Set up Storage!
insert into
	storage.buckets (id, name)
values
	('avatars', 'avatars');

create policy "Avatar images are publicly accessible." on storage.objects for
select
	using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects for insert
with
	check (bucket_id = 'avatars');
```

---

TITLE: Creating Triggers for Automatic Embedding Generation (SQL)
DESCRIPTION: This SQL snippet defines a `plpgsql` function `embedding_input` to customize the text used for embedding generation by concatenating title and content. It then sets up two triggers: `embed_documents_on_insert` to enqueue embedding jobs after new documents are inserted, and `embed_documents_on_update` to enqueue jobs when `title` or `content` columns are updated. Both triggers utilize the `util.queue_embeddings` function.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/automatic-embeddings.mdx#_snippet_13

LANGUAGE: SQL
CODE:

```
-- Customize the input for embedding generation
-- e.g. Concatenate title and content with a markdown header
create or replace function embedding_input(doc documents)
returns text
language plpgsql
immutable
as $$
begin
  return '# ' || doc.title || E'\n\n' || doc.content;
end;
$$;

-- Trigger for insert events
create trigger embed_documents_on_insert
  after insert
  on documents
  for each row
  execute function util.queue_embeddings('embedding_input', 'embedding');

-- Trigger for update events
create trigger embed_documents_on_update
  after update of title, content -- must match the columns in embedding_input()
  on documents
  for each row
  execute function util.queue_embeddings('embedding_input', 'embedding');
```

---

TITLE: Correct: Supabase SSR Cookie Handling Pattern (TypeScript)
DESCRIPTION: This snippet illustrates the REQUIRED and correct pattern for handling cookies when initializing Supabase clients for SSR. It mandates the use of `getAll()` and `setAll(cookiesToSet)` methods, ensuring proper session management and preventing application breakage. AI models MUST always generate this exact pattern.
SOURCE: https://github.com/supabase/supabase/blob/master/examples/prompts/nextjs-supabase-auth.md#_snippet_2

LANGUAGE: typescript
CODE:

```
{
  cookies: {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet) {
      const response = NextResponse.next({
        request,
      })

      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })

      return response
    }
  }
}
```

---

TITLE: Define Employees Table Schema (SQL)
DESCRIPTION: Defines the initial SQL schema for the 'employees' table, including 'id', 'name', and 'age' columns. This represents the desired state of the table.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/local-development/declarative-database-schemas.mdx#_snippet_4

LANGUAGE: sql
CODE:

```
create table "employees" (
  "id" integer not null,
  "name" text,
  "age" smallint not null
);
```

---

TITLE: Creating Initial Database Schema (PostgreSQL)
DESCRIPTION: This SQL snippet defines the initial database schema for a social application. It creates `uuid-ossp` and `citext` extensions, a custom `email` domain, and `users` and `posts` tables with appropriate columns, primary keys, and foreign key relationships. This setup provides the foundational structure for storing user and post data before implementing view tracking.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2022-07-18-seen-by-in-postgresql.mdx#_snippet_0

LANGUAGE: sql
CODE:

```
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS citext;

-- Create a email domain to represent and constraing email addresses
CREATE DOMAIN email
AS citext
CHECK ( LENGTH(VALUE) <= 255 AND value ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$' );

COMMENT ON DOMAIN email is 'lightly validated email address';

-- Create the users table
CREATE TABLE users (
    id bigserial PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    uuid uuid NOT NULL DEFAULT uuid_nonmc_v1(),

    email email NOT NULL,
    name text,
    about_html text,

    created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Create the posts table
CREATE TABLE posts (
    id bigserial PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    uuid uuid NOT NULL DEFAULT uuid_nonmc_v1(),

    title text,
    content text,
    main_image_src text,
    main_link_src text,

    created_by bigint REFERENCES users(id),

    last_hidden_at timestamptz,
    last_updated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
```

---

TITLE: Implementing Product Details ViewModel in Android Kotlin
DESCRIPTION: This ViewModel manages the state and business logic for the product details screen. It retrieves product details using a `productId` from `SavedStateHandle`, exposes product properties as `StateFlow`, and provides functions to update product name, price, and image, and save changes via the repository. It also includes a DTO to domain model conversion.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-kotlin.mdx#_snippet_19

LANGUAGE: kotlin
CODE:

```
@HiltViewModel
class ProductDetailsViewModel @Inject constructor(
    private val productRepository: ProductRepository,
    savedStateHandle: SavedStateHandle,
    ) : ViewModel() {

    private val _product = MutableStateFlow<Product?>(null)
    val product: Flow<Product?> = _product

    private val _name = MutableStateFlow("")
    val name: Flow<String> = _name

    private val _price = MutableStateFlow(0.0)
    val price: Flow<Double> = _price

    private val _imageUrl = MutableStateFlow("")
    val imageUrl: Flow<String> = _imageUrl

    init {
        val productId = savedStateHandle.get<String>(ProductDetailsDestination.productId)
        productId?.let {
            getProduct(productId = it)
        }
    }

    private fun getProduct(productId: String) {
        viewModelScope.launch {
           val result = productRepository.getProduct(productId).asDomainModel()
            _product.emit(result)
            _name.emit(result.name)
            _price.emit(result.price)
        }
    }

    fun onNameChange(name: String) {
        _name.value = name
    }

    fun onPriceChange(price: Double) {
        _price.value = price
    }

    fun onSaveProduct(image: ByteArray) {
        viewModelScope.launch {
            productRepository.updateProduct(
                id = _product.value?.id,
                price = _price.value,
                name = _name.value,
                imageFile = image,
                imageName = "image_${_product.value.id}",
            )
        }
    }

    fun onImageChange(url: String) {
        _imageUrl.value = url
    }

    private fun ProductDto.asDomainModel(): Product {
        return Product(
            id = this.id,
            name = this.name,
            price = this.price,
            image = this.image
        )
    }
}
```

---

TITLE: Implementing a PostgreSQL Function as a Trigger for `updated_at`
DESCRIPTION: This example provides a PostgreSQL function `update_updated_at` designed to be used as a trigger. It automatically updates the `updated_at` column of a row to the current timestamp (`now()`) whenever the row is modified. The accompanying `CREATE TRIGGER` statement attaches this function to the `my_schema.my_table` for `BEFORE UPDATE` events.
SOURCE: https://github.com/supabase/supabase/blob/master/examples/prompts/database-functions.md#_snippet_2

LANGUAGE: PostgreSQL
CODE:

```
create or replace function my_schema.update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Update the "updated_at" column on row modification
  new.updated_at := now();
  return new;
end;
$$;

create trigger update_updated_at_trigger
before update on my_schema.my_table
for each row
execute function my_schema.update_updated_at();
```

---

TITLE: Deprecating auth.email() in Postgres RLS Policies
DESCRIPTION: This snippet demonstrates the deprecation of the `auth.email()` function in Supabase RLS policies. It contrasts the deprecated method with the recommended approach, which involves extracting the email from the full JWT payload using `auth.jwt() ->> 'email'`, providing a more generic and flexible way to access user claims.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/troubleshooting/deprecated-rls-features-Pm77Zs.mdx#_snippet_1

LANGUAGE: SQL
CODE:

```
- DEPRECATED
create policy "User can view their profile."
on profiles for select using (
  auth.email() = email
);
```

LANGUAGE: SQL
CODE:

```
-- RECOMMENDED
create policy "User can view their profile."
on profiles for select using (
  (auth.jwt() ->> 'email') = email
);
```

---

TITLE: Interpreting Detailed EXPLAIN ANALYZE Output (PostgreSQL EXPLAIN)
DESCRIPTION: This example illustrates a detailed output from `EXPLAIN ANALYZE`, showing actual execution statistics alongside estimated costs. It highlights key metrics like `actual time`, `Rows Removed by Filter`, and `Planning Time`, which are crucial for identifying performance bottlenecks and understanding the query planner's efficiency.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/troubleshooting/understanding-postgresql-explain-output-Un9dqX.mdx#_snippet_2

LANGUAGE: PostgreSQL EXPLAIN
CODE:

```
Seq Scan on users  (cost=0.00..19.00 rows=1 width=240) (actual time=0.026..0.026 rows=1 loops=1)
  Filter: (user_id = 1)
  Rows Removed by Filter: 999
Planning Time: 0.135 ms
```

---

TITLE: Authenticating Users with Supabase in Flutter (Dart)
DESCRIPTION: This snippet showcases the new, more descriptive authentication methods introduced in `supabase-flutter v1`. It demonstrates how to sign in a user using email and password, and how to initiate an OAuth sign-in flow with a specified provider like GitHub. These methods provide clearer intent and improved predictability.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2022-10-21-supabase-flutter-sdk-v1-released.mdx#_snippet_1

LANGUAGE: Dart
CODE:

```
await supabase.auth.signInWithPassword(email: email, password: password);

await supabase.auth.signInWithOAuth(Provider.github)
```

---

TITLE: Calling Llamafile with Supabase Functions-JS SDK - TypeScript
DESCRIPTION: This TypeScript code defines a Supabase Edge Function that uses `@supabase/functions-js` to interact with the Llamafile server in OpenAI API compatible mode. It processes a prompt from the request URL and streams the AI model's output.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-08-21-mozilla-llamafile-in-supabase-edge-functions.mdx#_snippet_3

LANGUAGE: ts
CODE:

```
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
const session = new Supabase.ai.Session('LLaMA_CPP')

Deno.serve(async (req: Request) => {
  const params = new URL(req.url).searchParams
  const prompt = params.get('prompt') ?? ''

  // Get the output as a stream
  const output = await session.run(
    {
      messages: [
        {
          role: 'system',
          content:
            'You are LLAMAfile, an AI assistant. Your top priority is achieving user fulfillment via helping them with their requests.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
    {
      mode: 'openaicompatible', // Mode for the inference API host. (default: 'ollama')
      stream: false,
    }
  )

  console.log('done')
  return Response.json(output)
})
```

---

TITLE: Handling Realtime Card Updates in Angular Component
DESCRIPTION: This TypeScript function, `handleRealtimeUpdates`, subscribes to the real-time changes provided by `dataService.getTableChanges()`. It processes updates specifically for the 'cards' table, identifying the event type (INSERT, UPDATE, DELETE) and applying the corresponding changes to the local `listCards` data structure. For 'INSERT', it pushes the new card; for 'UPDATE', it replaces the existing card; and for 'DELETE', it filters out the removed card.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2022-08-24-building-a-realtime-trello-board-with-supabase-and-angular.mdx#_snippet_29

LANGUAGE: TypeScript
CODE:

```
  handleRealtimeUpdates() {
    this.dataService.getTableChanges().subscribe((update: any) => {
      const record = update.new?.id ? update.new : update.old;
      const event = update.eventType;

      if (!record) return;

      if (update.table == 'cards') {
        if (event === 'INSERT') {
          this.listCards[record.list_id].push(record);
        } else if (event === 'UPDATE') {
          const newArr = [];

          for (let card of this.listCards[record.list_id]) {
            if (card.id == record.id) {
              card = record;
            }
            newArr.push(card);
          }
          this.listCards[record.list_id] = newArr;
        } else if (event === 'DELETE') {
          this.listCards[record.list_id] = this.listCards[
            record.list_id
          ].filter((card: any) => card.id !== record.id);
        }
      } else if (update.table == 'lists') {
        // TODO
      }
    });
  }
```

---

TITLE: Signing Up with Email and Password - Implicit Flow (JavaScript)
DESCRIPTION: This snippet demonstrates how to sign up a new user with an email and password using the Supabase JavaScript client in an implicit flow. It initializes the Supabase client and then calls `supabase.auth.signUp()` with the user's email, password, and an optional `emailRedirectTo` URL for post-confirmation redirection. The `emailRedirectTo` URL must be configured as a Redirect URL in the Supabase dashboard or configuration file.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/passwords.mdx#_snippet_0

LANGUAGE: JavaScript
CODE:

```
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://your-project.supabase.co', 'your-anon-key')

// ---cut---
async function signUpNewUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'valid.email@supabase.io',
    password: 'example-password',
    options: {
      emailRedirectTo: 'https://example.com/welcome',
    },
  })
}
```

---

TITLE: Creating Embeddings with OpenAI API (TypeScript)
DESCRIPTION: This snippet demonstrates how to generate a vector embedding for a user's question using the OpenAI `text-embedding-ada-002` model. It sends a POST request to the OpenAI embeddings API, handling potential errors and extracting the generated embedding from the response. The `openAiKey` is required for authorization, and `sanitizedQuery` is the input text.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/examples/nextjs-vector-search.mdx#_snippet_10

LANGUAGE: TypeScript
CODE:

```
const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${openAiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'text-embedding-ada-002',
    input: sanitizedQuery.replaceAll('\n', ' '),
  }),
})

if (embeddingResponse.status !== 200) {
  throw new ApplicationError('Failed to create embedding for question', embeddingResponse)
}

const {
  data: [{ embedding }],
} = await embeddingResponse.json()
```

---

TITLE: Setting Supabase Project Secrets for Deployment - Bash
DESCRIPTION: This command sets the environment variables defined in the local `.env` file as secrets on the hosted Supabase project. This is crucial for the deployed Edge Functions to access the correct Llamafile server URL.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-08-21-mozilla-llamafile-in-supabase-edge-functions.mdx#_snippet_8

LANGUAGE: bash
CODE:

```
supabase secrets set --env-file supabase/functions/.env
```
