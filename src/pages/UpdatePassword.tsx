import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // This effect will handle the session and password update
  // once the component mounts and the session is available.
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // The user is in the password recovery flow.
        // You can use the session to update the password.
        // This part is handled by the form submission.
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
        setError("Password should be at least 6 characters.");
        toast({
            title: "Error",
            description: "Password should be at least 6 characters.",
            variant: "destructive",
        });
        return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      toast({
        title: "Error updating password",
        description: updateError.message,
        variant: "destructive",
      });
    } else {
      setSuccess(true);
      toast({
        title: "Password updated successfully!",
        description: "You can now log in with your new password.",
      });
      setTimeout(() => navigate('/login'), 3000); // Redirect to login after 3 seconds
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Update Your Password</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {success ? (
          <p className="text-green-500 text-center">Password updated successfully! Redirecting to login...</p>
        ) : (
          <form onSubmit={handlePasswordUpdate}>
            <div className="mb-4">
              <label htmlFor="password_input" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <Input
                id="password_input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirm_password_input" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <Input
                id="confirm_password_input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdatePassword; 