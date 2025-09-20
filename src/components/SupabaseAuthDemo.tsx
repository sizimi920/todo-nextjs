"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export default function SupabaseAuthDemo() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then((res) => {
      if (res.data?.user) setUser(res.data.user as User);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  async function signUp() {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage("確認メールを送信しました（Supabaseの設定によります）。");
  }

  async function signIn() {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage("サインインしました");
  }

  async function signOut() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage("サインアウトしました");
  }

  return (
    <div className="w-full max-w-md p-6 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Supabase Auth Demo</h2>

      <div className="flex flex-col gap-2 mb-4">
        <input
          className="border px-2 py-1 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
        />
        <input
          className="border px-2 py-1 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={signUp}
          disabled={loading}
        >
          Sign Up
        </button>
        <button
          className="px-3 py-1 bg-green-600 text-white rounded"
          onClick={signIn}
          disabled={loading}
        >
          Sign In
        </button>
        <button
          className="px-3 py-1 bg-gray-600 text-white rounded"
          onClick={signOut}
          disabled={loading}
        >
          Sign Out
        </button>
      </div>

      {message && <div className="mb-2 text-sm">{message}</div>}

      <div className="text-sm">
        <strong>Current user:</strong>
        <pre className="mt-2 bg-gray-100 p-2 rounded text-xs max-h-40 overflow-auto">{JSON.stringify(user, null, 2) || "null"}</pre>
      </div>
    </div>
  );
}
