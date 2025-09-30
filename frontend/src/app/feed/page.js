"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
const BASE_API = process.env.NEXT_PUBLIC_BASE_API || "http://localhost:3001";

function decodeJwt(token) {
    try {
        const [, payload] = token.split(".");
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const json = typeof window !== "undefined" ? window.atob(base64) : Buffer.from(base64, "base64").toString("utf8");
        return JSON.parse(json);
    } catch {
        return null;
    }
}

// Utility: ensure minimum delay (e.g., for showing spinner)
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Format waktu relatif dalam Bahasa Indonesia
function formatRelativeId(timeInput) {
    if (!timeInput) return '';
    const d = new Date(timeInput);
    if (Number.isNaN(d.getTime())) return '';
    const now = Date.now();
    let diffSec = Math.floor((now - d.getTime()) / 1000);
    if (diffSec < 0) diffSec = 0; // antisipasi jam sistem berbeda

    if (diffSec < 60) return 'baru saja';
    const minutes = Math.floor(diffSec / 60);
    if (minutes < 60) return `${minutes} menit yang lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam yang lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari yang lalu`;
}

export default function FeedPage() {
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [following, setFollowing] = useState([]);
    const [suggested, setSuggested] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creating, setCreating] = useState(false);
    const [content, setContent] = useState("");
    const [token, setToken] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [alert, setAlert] = useState("");
    const loaderRef = useRef(null);

    async function refreshAccessToken() {
        const res = await fetch(`${BASE_API}/api/refresh`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.token) {
            localStorage.setItem("token", data.token);
            return data.token;
        }
        return null;
    }

    // Centralized token checker: returns existing token or tries to refresh
    async function getValidToken() {
        try {
            let t = localStorage.getItem('token');
            if (t) return t;
            const newToken = await refreshAccessToken();
            if (newToken) return newToken;
        } catch (_) {
            // ignore storage errors
        }
        router.push('/')
        throw new Error('Session expired. Please log in again.');
    }

    async function fetchFeed(token, { page = 1, limit = 10 } = {}) {
        let useToken = token;
        if (!useToken) useToken = await getValidToken();
        const res = await fetch(`${BASE_API}/api/feed?page=${page}&limit=${limit}`, {
            headers: {
                Authorization: `Bearer ${useToken}`,
            },
            credentials: "include",
        });

        // If backend becomes protected later and returns 401, try refresh then retry once
        if (res.status === 401) {
            const newToken = await refreshAccessToken();
            if (!newToken) throw new Error("Session expired. Please log in again.");
            const retry = await fetch(`${BASE_API}/api/feed?page=${page}&limit=${limit}`, {
                headers: { Authorization: `Bearer ${newToken}` },
                credentials: "include",
            });
            if (!retry.ok) throw new Error("Failed to load feed after refresh.");
            return retry.json();
        }

        if (!res.ok) {
            let msg = `Failed to load feed (${res.status})`;
            try {
                const e = await res.json();
                if (e?.error) msg += `: ${e.error}`;
            } catch { }
            throw new Error(msg);
        }
        return res.json();
    }

    async function fetchFollowing(token, userId) {
        let useToken = token;
        if (!useToken) useToken = await getValidToken();
        const res = await fetch(`${BASE_API}/api/users/${userId}/following`, {
            headers: {
                Authorization: `Bearer ${useToken}`,
            },
            credentials: "include",
        });

        if (res.status === 401) {
            const newToken = await refreshAccessToken();
            if (!newToken) throw new Error("Session expired. Please log in again.");
            const retry = await fetch(`${BASE_API}/api/users/${userId}/following`, {
                headers: { Authorization: `Bearer ${newToken}` },
                credentials: "include",
            });
            if (!retry.ok) throw new Error("Failed to load following after refresh.");
            return retry.json();
        }

        if (!res.ok) {
            let msg = `Failed to load following (${res.status})`;
            try {
                const e = await res.json();
                if (e?.error) msg += `: ${e.error}`;
            } catch { }
            throw new Error(msg);
        }
        return res.json();
    }

    async function createPost() {
        const trimmed = content.trim();
        if (!trimmed) {
            setError("Post content cannot be empty.");
            return;
        }
        setCreating(true);
        setError(null);
        let useToken = await getValidToken();
        try {
            const res = await fetch(`${BASE_API}/api/posts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${useToken}`,
                },
                credentials: "include",
                body: JSON.stringify({ content: trimmed }),
            });
            if (res.status === 401) {
                const newToken = await refreshAccessToken();
                if (!newToken) throw new Error("Session expired. Please log in again.");
                useToken = newToken;
                const retry = await fetch(`${BASE_API}/api/posts`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${newToken}`,
                    },
                    credentials: "include",
                    body: JSON.stringify({ user_id: userId, content: trimmed }),
                });
                if (!retry.ok) throw new Error("Failed to create post after refresh.");
                const created = await retry.json();
                setPosts((prev) => [created, ...prev]);
                setAlert("");
                setContent("");
                return;
            }
            if (!res.ok) {
                let msg = `Failed to create post (${res.status})`;
                try {
                    const e = await res.json();
                    if (e?.error) msg += `: ${e.error}`;
                } catch { }
                throw new Error(msg);
            }
            const created = await res.json();
            setPosts((prev) => [created, ...prev]);
            setContent("");
            setAlert("");
        } catch (e) {
            setError(e.message);
            console.log(e)
        } finally {
            setCreating(false);
        }
    }

    async function fetchSuggested(token, userId) {
        let useToken = token;
        if (!useToken) useToken = await getValidToken();
        const res = await fetch(`${BASE_API}/api/users/${userId}/suggested`, {
            headers: { Authorization: `Bearer ${useToken}` },
            credentials: 'include',
        });
        if (res.status === 401) {
            const newToken = await refreshAccessToken();
            if (!newToken) throw new Error('Session expired. Please log in again.');
            const retry = await fetch(`${BASE_API}/api/users/${userId}/suggested`, {
                headers: { Authorization: `Bearer ${newToken}` },
                credentials: 'include',
            });
            if (!retry.ok) throw new Error('Failed to load users after refresh.');
            return retry.json();
        }
        if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
        return res.json();
    }

    async function toggleFollow(targetId, isFollowingNow) {
        const endpoint = isFollowingNow ? 'unfollow' : 'follow';
        let useToken = await getValidToken();
        const doCall = async (tok) => fetch(`${BASE_API}/api/${endpoint}/${targetId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tok}` },
            credentials: 'include',
        });
        let res = await doCall(useToken);
        if (res.status === 401) {
            const newToken = await refreshAccessToken();
            if (!newToken) throw new Error('Session expired. Please log in again.');
            useToken = newToken;
            res = await doCall(useToken);
        }
        if (!res.ok) throw new Error('Failed to update follow.');
        // Refresh following, suggested, and feed lists after action
        const [fl, sg, fd] = await Promise.all([
            fetchFollowing(useToken, userId).catch(() => []),
            fetchSuggested(useToken, userId).catch(() => []),
            fetchFeed(useToken, { page: 1, limit }).catch(() => null),
        ]);
        setFollowing(Array.isArray(fl) ? fl : []);
        setSuggested(Array.isArray(sg) ? sg : []);
        if (Array.isArray(fd)) {
            setPosts(fd);
            setPage(1);
            setHasMore(fd.length === limit);
        }
    }

    useEffect(() => {
        const checkAndRedirect = () => {
        try {
            const t = localStorage.getItem('token');
            if (!t) router.replace('/');
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

    useEffect(() => {
        const t = localStorage.getItem("token");
        if (!t) {
            router.push("/");
            return;
        }
        const payload = decodeJwt(t);
        setUserInfo(payload);
        console.log(payload, "payload")
        const uid = payload?.sub;
        if (!uid) {
            router.push("/");
            return;
        }

        (async () => {
            setLoading(true);
            setError(null);
            try {
                setToken(t);
                setUserId(uid);
                const [data, fl, sg] = await Promise.all([
                    fetchFeed(t, { page: 1, limit }),
                    fetchFollowing(t, uid).catch(() => []),
                    fetchSuggested(t, uid).catch(() => []),
                ]);
                const list = Array.isArray(data) ? data : [];
                setPosts(list);
                setHasMore(list.length === limit);
                setFollowing(Array.isArray(fl) ? fl : []);
                setSuggested(Array.isArray(sg) ? sg : []);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        try {
            const fetchPromise = fetchFeed(localStorage.getItem('token'), { page: nextPage, limit });
            // Add a 1.5s delay so spinner is visible
            const [data] = await Promise.all([fetchPromise, sleep(1500)]);
            const list = Array.isArray(data) ? data : [];
            setPosts((prev) => [...prev, ...list]);
            setPage(nextPage);
            setHasMore(list.length === limit);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingMore(false);
        }
    };

    // Infinite scroll via IntersectionObserver on sentinel
    useEffect(() => {
        if (!hasMore || loading) return;
        const el = loaderRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !loadingMore) {
                    loadMore();
                }
            },
            { root: null, rootMargin: "200px", threshold: 0 }
        );
        observer.observe(el);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasMore, loading, loadingMore, page, limit]);

    const logout = async () => {
        try {
            await fetch(`${BASE_API}/api/logout`, { method: "POST", credentials: "include" });
        } catch { }
        localStorage.removeItem("token");
        router.push("/");
    };

    const handleCreateFeed = (e) => {
        // console.log(e.target.value.length,"length feed")
        if (e.target.value.length > 200) {
            setAlert("Post content cannot exceed 200 characters.");
            return;
        }
        setAlert("");
        setContent(e.target.value);
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-900">Feed</h1>
                    <button onClick={logout} className="text-sm font-semibold text-sky-700 hover:underline">Logout</button>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2">
                    {/* Create Post */}
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm mb-6">
                        {alert && <div className="mb-2 text-red-600 font-medium">{alert}</div>}
                        <textarea
                            value={content}
                            onChange={(e) => handleCreateFeed(e)}
                            placeholder="Write something..."
                            className="w-full resize-y min-h-[80px] rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
                        />
                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={createPost}
                                disabled={creating}
                                className="inline-flex items-center rounded-md border-2 border-sky-300 bg-white px-3 py-2 font-semibold text-sky-700 hover:bg-sky-50 active:bg-sky-100 disabled:opacity-50 cursor-pointer transition"
                            >
                                {creating ? 'Posting…' : 'Post'}
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <div className="mt-6 flex justify-center">

                            <div className="flex items-center gap-2 text-slate-500">
                                <div
                                    className="w-6 h-6 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin"
                                    aria-label="Loading more"
                                />
                                <span className="sr-only">Loading…</span>
                            </div>
                        </div>
                    )}
                    {error && <div className="rounded-md bg-red-500/90 text-white px-3 py-2 mb-4">{error}</div>}

                    {!loading && !error && posts.length === 0 && (
                        <div className="text-slate-600">No posts yet from people you follow.</div>
                    )}

                    <ul className="space-y-4">
                        {posts.map((p) => (
                            <li key={p.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="text-sm text-slate-500 mb-1">by <span className="font-medium text-slate-800">{p.author || userInfo.username}</span></div>
                                <div className="whitespace-pre-wrap text-slate-900">{p.content}</div>
                                <div className="text-xs text-slate-400 mt-2">{p.created_at ? formatRelativeId(p.created_at) : ''}</div>
                            </li>
                        ))}
                    </ul>

                    {/* Sentinel for infinite scroll */}
                    <div ref={loaderRef} className="h-1" />

                    {!loading && hasMore && (
                        <div className="mt-6 flex justify-center">
                            {loadingMore ? (
                                <div className="flex items-center gap-2 text-slate-500">
                                    <div
                                        className="w-6 h-6 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin"
                                        aria-label="Loading more"
                                    />
                                    <span className="sr-only">Loading…</span>
                                </div>
                            ) : (
                                // Fallback button; auto-load triggers via observer
                                <button
                                    onClick={loadMore}
                                    className="rounded-md border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                    Load more
                                </button>
                            )}
                        </div>
                    )}

                </section>

                {/* Right Sidebar */}
                <aside className="lg:col-span-1 space-y-6 sticky top-20 self-start">
                    {/* Following list */}
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="text-base font-semibold text-slate-900 mb-3">Following</h2>
                        {following.length === 0 ? (
                            <div className="text-slate-600">You are not following anyone yet.</div>
                        ) : (
                            <ul className="space-y-2">
                                {following.map((u) => (
                                    <li key={u.id} className="flex items-center justify-between gap-2">
                                        <span className="truncate">@{u.username}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Suggested Users */}
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="text-base font-semibold text-slate-900 mb-3">People</h2>
                        {suggested.length === 0 ? (
                            <div className="text-slate-600">No suggestions right now.</div>
                        ) : (
                            <ul className="space-y-3">
                                {suggested.map((u) => (
                                    <li key={u.id} className="flex items-center justify-between gap-2">
                                        <div>
                                            <div className="font-medium text-slate-900">@{u.username}</div>
                                            <div className="text-xs text-slate-500">{u.posts_count} posts • {u.followers_count} followers</div>
                                        </div>
                                        <button
                                            onClick={() => toggleFollow(u.id, u.is_following)}
                                            className={`text-sm font-semibold rounded-md px-3 py-1 border cursor-pointer ${u.is_following ? 'border-slate-300 text-slate-700 hover:bg-slate-50' : 'border-sky-300 text-sky-700 hover:bg-sky-50'}`}
                                        >
                                            {u.is_following ? 'Unfollow' : 'Follow'}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
}
