// ====== KONFIGURASI UJIAN (edit file ini saja) ======
window.EXAM_CONFIG = {
  title: "Ujian Tengah Semester",
  school: "Nama Sekolah / Kampus",
  // Link Google Form: buka form > Kirim > ikon "<>" (Sematkan HTML) > salin URL di src="..."
  formUrl: "https://docs.google.com/forms/d/e/ISI_ID_FORM_ANDA/viewform",
  examToken: "UJIAN2026",     // token yang dibagikan pengawas ke peserta
  adminPin: "123456",         // PIN pengawas untuk membuka kunci peserta
  durationMinutes: 60,        // durasi ujian
  maxViolations: 3,           // setelah batas ini layar terkunci
  autoFinishOnSubmit: true,   // otomatis selesai saat form terdeteksi terkirim
  // Opsional: URL Google Apps Script (lihat README) untuk merekam log ke Google Sheet
  logEndpoint: ""
};
