# Ganapatih Feed — Monorepo (Backend + Frontend)

Proyek ini terdiri dari dua bagian:
- backend/ — REST API (Node.js/Express + PostgreSQL/Knex) untuk autentikasi, posts, follow/unfollow, dan feed.
- frontend/ — Aplikasi Next.js (App Router) sebagai antarmuka pengguna.

Dokumen ini mencakup panduan setup, instruksi menjalankan, dokumentasi API, serta catatan desain arsitektur. Seluruh instruksi ditulis dalam Bahasa Indonesia.

## Struktur Folder

```
./
├── backend/           # API server (Express)
├── frontend/          # Next.js UI
└── README.md          # Dokumen ini
```

## Prasyarat
- Node.js LTS (>= 18)
- npm atau pnpm/yarn
- PostgreSQL (disarankan lokal, bisa juga pakai managed DB)

## Setup Backend (API)

1) Salin berkas env dan isi sesuai lingkungan Anda

Buat file `backend/.env`:

```
# Server
PORT=3001
CORS_ORIGIN=http://localhost:3000

# JWT
JWT_SECRET=your_access_token_secret
JWT_EXPIRES_IN=15m
REFRESH_SECRET=your_refresh_token_secret
REFRESH_EXPIRES_IN=7d
REFRESH_COOKIE_NAME=refresh_token
REFRESH_COOKIE_SECURE=false
REFRESH_COOKIE_SAMESITE=Lax

# Database (PostgreSQL)
DATABASE_URL=postgres://<user>:<password>@localhost:5432/<dbname>
```

Catatan:
- Ubah `CORS_ORIGIN` ke origin frontend Anda.
- Untuk produksi, gunakan secret yang kuat dan atur cookie `Secure=true` serta `SameSite=None` bila lintas domain.

2) Instal dependensi

```bash
cd backend
npm install
```

3) Migrasi dan Seed Database (Knex)

```bash
# Jalankan migrasi schema
npx knex migrate:latest

# Jalankan seed data awal (opsional)
npx knex seed:run
```

4) Menjalankan server

```bash
# Salah satu dari ini, tergantung skrip yang tersedia
npm run dev
# atau
npm start
# atau
node server.js
```

5) Cek kesehatan server

Buka: `http://localhost:3001/health` (atau sesuai `PORT`).

## Setup Frontend (UI)

1) Konfigurasi lingkungan

Buat file `frontend/.env.local`:

```
NEXT_PUBLIC_BASE_API=http://localhost:3001
```

2) Instal dependensi

```bash
cd frontend
npm install
```

3) Jalankan dev server

```bash
npm run dev
```

4) Buka aplikasi

Kunjungi `http://localhost:3000`.

## Alur Autentikasi (Ringkas)
- Pengguna login via `POST /api/login` → API mengembalikan `access token (JWT)` dalam respons JSON dan mengatur `refresh token` di cookie httpOnly.
- Frontend menyimpan access token di `localStorage` dan mengirimkannya sebagai header `Authorization: Bearer <token>` untuk endpoint yang dilindungi.
- Jika access token kedaluwarsa (401), frontend memanggil `POST /api/refresh` (cookie-only) untuk mendapatkan access token baru, lalu mengulangi request.
- Logout akan menghapus cookie refresh di server; frontend juga menghapus access token dari localStorage.

## Dokumentasi API

Format umum:
- Auth protected endpoints menggunakan header: `Authorization: Bearer <access_token>`
- Response JSON mengembalikan data mentah (raw) atau objek hasil operasi.
- Status penting: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 409 (Conflict), 500 (Server Error)

### Auth

1) Register
- Method: POST `/api/register`
- Body: `{ "username": string, "password": string }`
- 201: Mengembalikan user minimal `{ id, username }` (bisa bervariasi sesuai implementasi)
- 409: Username sudah dipakai

Contoh:
```http
POST /api/register
Content-Type: application/json

{ "username": "budi", "password": "rahasia123" }
```

2) Login
- Method: POST `/api/login`
- Body: `{ "username": string, "password": string }`
- 200: `{ "token": "<access_jwt>" }` dan menyetel cookie httpOnly untuk refresh token

3) Refresh Access Token
- Method: POST `/api/refresh`
- Cookie: refresh token (httpOnly)
- 200: `{ "token": "<access_jwt_baru>" }`

4) Logout
- Method: POST `/api/logout`
- Menghapus cookie refresh

### Posts

1) Create Post
- Method: POST `/api/posts`
- Header: `Authorization: Bearer <token>`
- Body: `{ "content": string }`
- 201/200: Mengembalikan post yang dibuat `{ id, user_id, content, created_at, ... }`

### Follow / Unfollow

1) Follow user
- Method: POST `/api/follow/:userid`
- Header: `Authorization: Bearer <token>`
- 200: Sukses (no content/objek hasil sederhana)

2) Unfollow user
- Method: POST `/api/unfollow/:userid`
- Header: `Authorization: Bearer <token>`
- 200: Sukses

3) Following list
- Method: GET `/api/users/:id/following`
- Header: (disarankan) `Authorization: Bearer <token>`
- 200: Array user yang di-follow

4) Followers list
- Method: GET `/api/users/:id/followers`
- Header: (disarankan) `Authorization: Bearer <token>`
- 200: Array user yang mengikuti

### Users

1) Suggested users
- Method: GET `/api/users/:id/suggested`
- Header: (disarankan) `Authorization: Bearer <token>`
- 200: Array pengguna dengan metrik `{ id, username, posts_count, followers_count, is_following }`

### Feed

1) Feed berdasarkan yang di-follow (user dari JWT)
- Method: GET `/api/feed`
- Query: `page` (default 1), `limit` (default 10)
- Header: `Authorization: Bearer <token>`
- 200: Array posts dari user yang di-follow

Contoh:
```
GET /api/feed?page=1&limit=10
Authorization: Bearer <token>
```

## Catatan Desain (Design Notes)

- Arsitektur
  - Backend: Express + Knex (PostgreSQL). Terdapat model/controller untuk Users, Posts, dan Follows.
  - Frontend: Next.js (App Router) dengan Tailwind. Halaman `feed` menampilkan form create post, daftar feed, daftar following, dan suggested users.

- Autentikasi & Keamanan
  - Access token (JWT) di header, refresh token di cookie httpOnly agar tidak bisa diakses JS (mengurangi risiko XSS).
  - CORS mengizinkan credentials (cookie) dan origin dikontrol via env (`CORS_ORIGIN`).

- Konsistensi Response
  - Error 409 (Conflict) dipakai saat duplikasi (misal username atau unique pair follow) — memudahkan penanganan di frontend.

- Feed & Pagination
  - Feed menggunakan user dari JWT (bukan param path), mendukung pagination dengan `page` dan `limit`.
  - Frontend menggunakan infinite scroll (IntersectionObserver) dan animasi spinner dengan jeda minimal untuk UX yang halus.

- Refresh Token Flow di Frontend
  - Saat menerima 401, frontend mencoba `POST /api/refresh` lalu mengulang request sekali lagi.
  - Terdapat helper terpusat untuk memastikan token valid sebelum request.

## Cara Pakai (Alur Cepat)
1) Register akun lalu login.
2) Setelah login, akan diarahkan ke halaman `/feed`.
3) Buat post, follow/unfollow pengguna lain dari panel kanan, dan scroll untuk memuat lebih banyak feed.

## Troubleshooting
- CORS/401 saat refresh:
  - Pastikan `CORS_ORIGIN` sesuai dengan URL frontend dan `credentials: true` di backend.
  - Pastikan cookie refresh tidak diblokir oleh SameSite/secure policy.
- Duplicate key (23505) di database:
  - API mengembalikan 409. Tangani di frontend untuk menampilkan pesan ramah pengguna.
- Token tidak tersimpan:
  - Frontend menyimpan access token di `localStorage` dengan key `token`. Periksa konsol bila ada error.

## Lisensi
Proyek ini untuk tujuan edukasi/demonstrasi. Gunakan dengan bijak dan sesuaikan keperluan produksi Anda.
