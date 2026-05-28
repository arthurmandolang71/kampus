-- Jalankan sekali di TiDB Cloud Console atau via MCP sebelum deploy
-- Migration: tambah tabel kesan_pesan (2026-05-27)

CREATE TABLE IF NOT EXISTS mahasiswa (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  nim         VARCHAR(20)  UNIQUE NOT NULL,
  nama        VARCHAR(100) NOT NULL,
  email       VARCHAR(100),
  jurusan     VARCHAR(100),
  angkatan    YEAR,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dosen (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  nip             VARCHAR(20)  UNIQUE NOT NULL,
  nama            VARCHAR(100) NOT NULL,
  email           VARCHAR(100),
  bidang_keahlian VARCHAR(100),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mata_kuliah (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  kode       VARCHAR(20)  UNIQUE NOT NULL,
  nama       VARCHAR(100) NOT NULL,
  sks        TINYINT,
  semester   TINYINT,
  dosen_id   INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS nilai (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  mahasiswa_id   INT NOT NULL,
  mata_kuliah_id INT NOT NULL,
  nilai_angka    DECIMAL(5,2),
  grade          VARCHAR(2),
  tahun_akademik VARCHAR(20),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_nilai (mahasiswa_id, mata_kuliah_id, tahun_akademik),
  FOREIGN KEY (mahasiswa_id)   REFERENCES mahasiswa(id)   ON DELETE CASCADE,
  FOREIGN KEY (mata_kuliah_id) REFERENCES mata_kuliah(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kesan_pesan (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  mahasiswa_id INT NOT NULL,
  kesan        TEXT NOT NULL,
  pesan        TEXT NOT NULL,
  kategori     VARCHAR(50) DEFAULT 'Umum',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sarana_prasarana (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  nama       VARCHAR(150) NOT NULL,
  jenis      VARCHAR(50),
  kondisi    VARCHAR(50),
  jumlah     INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
