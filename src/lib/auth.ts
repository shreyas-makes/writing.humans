import { supabase } from './supabase';
import type { SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';

export const signUp = async (credentials: SignUpWithPasswordCredentials) => {
  const { data, error } = await supabase.auth.signUp(credentials);
  if (error) {
    console.error('Error signing up:', error.message);
    throw error;
  }
  return data;
};

export const signIn = async (credentials: SignInWithPasswordCredentials) => {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) {
    console.error('Error signing in:', error.message);
    throw error;
  }
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  // Use production URL for password resets to avoid localhost issues
  const redirectUrl = import.meta.env.PROD 
    ? 'https://blue-scribe-suggest.vercel.app/update-password'
    : `${window.location.origin}/update-password`;
    
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  if (error) {
    console.error('Error sending password reset email:', error.message);
    throw error;
  }
  return data;
};

export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    // It's often okay for this to fail (e.g., user not logged in), so re-throwing might not be desired.
    // Depending on your app's needs, you might return null or a specific error object.
    return null;
  }
  return session?.user ?? null;
};

export const onAuthStateChange = (callback: (event: string, session: import('@supabase/supabase-js').Session | null) => void) => {
  const { data: authListener } = supabase.auth.onAuthStateChange(callback);
  return authListener;
}; 