"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const BASE_API = process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:3001'

async function authenticate(username, password, mode) {
  const res = await fetch(`${BASE_API}/api/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.log(res)
    console.log(errorData)
    switch (res.status) {
      case 400:
        throw new Error(`Incomplete or invalid input (${res.status} ${errorData.error})`);
      case 401:
        throw new Error(`Authentication failed (invalid token) (${res.status} ${errorData.error})`);
      case 409:
        throw new Error(`Username "${username}" already taken (${res.status} ${errorData.error})`);
      case 404:
        throw new Error(`Data or user not found (${res.status} ${errorData.error})`);
      default:
        break;
    }
    throw new Error(errorData.error || 'Authentication failed');
  }

  return res.json();
}

function validateInput(username, password) {
  if (!username || !password) {
    return 'Username and password are required.';
  }
  if (username.length < 3 || password.length < 6) {
    return 'Username must be at least 3 characters and password at least 6 characters long.';
  }
  return null;
}
export default function CardAuth() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  // If there's already an active session (token), redirect to /feed
  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      if (t) {
        router.replace('/feed');
      }
    } catch (_) {
      // ignore storage errors
    }
  }, [router]);

  // Also handle when the browser tab becomes active/focused
  useEffect(() => {
    const checkAndRedirect = () => {
      try {
        const t = localStorage.getItem('token');
        if (t) router.replace('/feed');
      } catch (_) {}
    };
    const onFocus = () => checkAndRedirect();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkAndRedirect();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [router]);

  const submit = async (mode) => {
    const validationError = validateInput(username, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const data = await authenticate(username, password, mode);
      setError(null);
      if (data?.token) {
        localStorage.setItem('token', data.token);
        router.push('/feed');
      }else if(data?.id){
        setSuccessMessage('Registration successful! You can now log in.');
      }
    } catch (err) {
      setError(err.message);
    }
  }
  return (

    <div className="relative w-full flex justify-center">
      <div className="relative w-full md:w-[520px] rounded-xl bg-white/95 px-10 py-8 shadow-xl ring-1 ring-black/10 flex flex-col">
        <h1 className="m-0 mb-4 text-left text-4xl font-extrabold text-slate-900">ganapatih feed</h1>
        <div className="flex flex-col gap-3">
          <input
            placeholder="username:"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
          />
          <input
            placeholder="password:"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
          />
        </div>

        <div className="mt-auto">
          <div className="mt-4 flex gap-3">
            <button onClick={() => { submit('login') }} className="flex-1 rounded-md border-2 border-sky-300 bg-white px-3 py-2 font-semibold text-sky-700 hover:bg-sky-50 active:bg-sky-100 transition cursor-pointer">[ masuk ]</button>
            <button onClick={() => { submit('register') }} className="flex-1 rounded-md border-2 border-slate-200 bg-slate-200 px-3 py-2 font-semibold text-slate-900 hover:bg-slate-300 active:bg-slate-400 cursor-pointer">[ daffar ]</button>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-500/95 px-3 py-2 text-sm text-white shadow">
              Error: {error}
            </div>
          )}
          {successMessage && (
            <div className="mt-4 rounded-md bg-green-500/95 px-3 py-2 text-sm text-white shadow">
              {successMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}