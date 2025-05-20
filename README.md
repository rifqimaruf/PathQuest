# ♟️ pathquest

## 🧩 Gambaran Proyek

**pathquest** adalah permainan web berbasis catur yang menampilkan semua jalur legal yang dapat dikunjungi oleh setiap bidak (misalnya, kuda, benteng) dari posisinya pada papan catur 8x8. Permainan ini menggunakan algoritma **Breadth-First Search (BFS)** untuk menghitung semua kemungkinan langkah legal, sesuai dengan kebutuhan tugas kuliah (DFS, BFS, DAG, Prim-Jarnik, atau Kruskal).  
Fitur utama mencakup antarmuka interaktif dan **visualisasi jalur langkah bidak**.

## 🎯 Tujuan

- Membuat antarmuka papan catur interaktif yang menampilkan jalur legal bidak.
- Mengimplementasikan BFS untuk menghitung semua langkah legal dari posisi bidak.
- Memvalidasi langkah catur berdasarkan aturan standar.
- Memvisualisasikan jalur langkah bidak secara jelas.

## 🛠️ Teknologi

- **Frontend:** React.js, HTML5 Canvas, Tailwind CSS  
- **Bahasa:** JavaScript  
- **Alat:** Node.js, npm, Git, Vercel  
- **Testing:** Jest  

## 📋 Daftar Tugas

### ✅ Inisiasi Proyek (Prioritas: Tinggi, Usaha: Rendah)

- Buat repositori GitHub: `pathquest`.
- Siapkan proyek React (`create-react-app`) dan pasang Tailwind CSS, Jest.
- Konfigurasi Git dan `.gitignore`.  
**Hasil:** Repositori siap pakai.  
**Penanggung Jawab:** [Nama Anggota]

---

### 🎨 Antarmuka Papan Catur (Prioritas: Tinggi, Usaha: Sedang)

- Buat komponen `Board` di React dengan Canvas untuk papan 8x8.
- Tampilkan bidak catur (misalnya, PNG untuk kuda, raja).
- Tambahkan klik untuk memilih bidak dan menyoroti jalur legal.
- Gunakan Tailwind CSS untuk desain responsif.  
**Hasil:** Papan catur interaktif dengan visualisasi jalur.  
**Penanggung Jawab:** [Nama Anggota]

---

### ✅ Validasi Langkah (Prioritas: Tinggi, Usaha: Sedang)

- Buat modul `MoveValidator` untuk aturan catur (misalnya, langkah kuda, benteng).
- Validasi langkah legal berdasarkan posisi bidak lain.  
**Hasil:** Modul validasi langkah catur.  
**Penanggung Jawab:** [Nama Anggota]

---

### 🔍 Algoritma BFS (Prioritas: Tinggi, Usaha: Sedang)

- Buat modul `Pathfinder` untuk menghitung semua jalur legal bidak dengan BFS.
- Modelkan papan sebagai graf (kotak sebagai node, langkah legal sebagai edge).
- Tampilkan semua kotak yang dapat dikunjungi dari posisi bidak.
- Uji dengan Jest (misalnya, langkah kuda dari `b1`).  
**Hasil:** BFS yang menyoroti semua jalur legal.  
**Penanggung Jawab:** [Nama Anggota]

---

### 🖍️ Visualisasi Jalur (Prioritas: Sedang, Usaha: Rendah)

- Tambahkan fitur di UI untuk menyoroti semua kotak yang dapat dicapai bidak.
- Gunakan efek visual (misalnya, warna berbeda untuk tiap bidak).  
**Hasil:** Visualisasi jalur legal di papan.  
**Penanggung Jawab:** [Nama Anggota]

---

### 🧪 Pengujian dan Dokumentasi (Prioritas: Tinggi, Usaha: Sedang)

- Uji BFS dan validasi langkah dengan Jest (misalnya, uji langkah kuda, raja).
- Dokumentasikan kode dengan JSDoc.
- Perbarui `README` dengan panduan penggunaan.  
**Hasil:** Proyek teruji dan terdokumentasi.  
**Penanggung Jawab:** [Nama Anggota]

