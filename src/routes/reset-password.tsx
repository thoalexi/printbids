import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/reset-password')({head:()=>meta('Reset password','Set a new password for your PrintBids account.'),component:ResetPage});
function ResetPage(){const [recovery,setRecovery]=useState(false);const [message,setMessage]=useState('');useEffect(()=>{setRecovery(window.location.hash.includes('type=recovery')||!!new URLSearchParams(window.location.search).get('code'));},[]);return <main className="max-w-md mx-auto px-6 py-16"><h1 className="text-3xl mb-8">Set a new password</h1>{recovery?<form className="space-y-5" onSubmit={async e=>{e.preventDefault();const password=String(new FormData(e.currentTarget).get('password'));const r=await supabase.auth.updateUser({password});setMessage(r.error?.message??'Password updated. You can now sign in with your new password.');}}><label>New password<input className="field" name="password" type="password" minLength={8} required/></label><Button>Update password</Button></form>:<p className="text-muted-foreground">Open this page from the password reset link in your email.</p>}<p role="status" className="mt-5 text-primary">{message}</p></main>}
