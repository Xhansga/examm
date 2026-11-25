# CBT Safe Exam untuk Google Form

Web app statis (HTML/CSS/JS, tanpa backend) yang menampilkan Google Form dalam mode ujian terkunci ala CBT.

## Fitur
- Login peserta (nama, NIS, token ujian) dan penanda air nama di layar
- Otomatis layar penuh, `Esc` dikunci (Chrome/Edge), wajib kembali ke layar penuh
- Deteksi: keluar layar penuh, pindah tab/jendela, alat pengembang, pintasan terlarang (F12, Ctrl+C/V/P/T/N dst.)
- Klik kanan, salin, tempel, seleksi teks, tombol Back dan refresh diblokir/dicatat
- Iframe `sandbox` tanpa `allow-popups`, jadi tautan dalam form tidak bisa membuka tab baru
- Hitung pelanggaran, layar terkunci otomatis, dibuka dengan PIN pengawas
- Timer yang tetap berjalan saat refresh (tersimpan di localStorage), form ditutup otomatis saat waktu habis
- Deteksi form terkirim lalu selesai otomatis
- Log real-time ke Google Sheet (opsional, `google-apps-script.gs`)

## Pasang
1. Edit `config.js` (link form, token, PIN, durasi).
2. Di Google Form: Settings > Responses, aktifkan *Limit to 1 response* bila perlu.
3. Push ke GitHub, lalu Settings > Pages > Source: **GitHub Actions**. Situs tayang di `https://USERNAME.github.io/NAMA-REPO/`.

## Batasan (penting)
- Web tidak bisa memblokir tab lain atau Alt+Tab. Aplikasi hanya mendeteksi lalu mencatat dan mengunci.
- Token dan PIN ada di `config.js` yang bisa dibaca peserta. Ini cukup untuk ujian kelas, bukan ujian berisiko tinggi.
- Tidak mendukung iOS Safari (tidak ada Fullscreen API). Gunakan laptop/PC atau Chrome Android.
- Pengawasan manusia tetap dibutuhkan.
