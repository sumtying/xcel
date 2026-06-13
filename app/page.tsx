"use client";

import { useState } from "react";
import { useStore, Transaction } from "../store/useStore";

const SENARAI_PERBELANJAAN = [
  "Belanja Bahan Mentah / Bekalan",
  "Belanja Pembungkusan & Branding",
  "Belanja Menyelenggara Peralatan & Mesin",
  "Belanja Utiliti",
  "Belanja Pengangkutan & Penghantaran",
  "Belanja Pemasaran & Jualan",
  "Belanja Upah",
  "Belanja Gaji",
  "Belanja Alatulis",
  "Belanja Perlesenan",
  "Belanja Sewa",
  "Lain-lain Belanja"
];

export default function Home() {
  const { companyName, setCompanyName, transactions, addTransaction, deleteTransaction } = useStore();
  const [activeTab, setActiveTab] = useState<'transaksi' | 'untung' | 'kewangan'>('transaksi');

  // Form states
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<'Masuk' | 'Keluar'>("Masuk");
  const [category, setCategory] = useState("Modal");
  const [nota, setNota] = useState("");

  // Company Name states
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState(companyName);

  // Filter states
  const [filterBulan, setFilterBulan] = useState("Semua");
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());

  // ==========================================
  // LOGIK PENAPISAN MASA (TIME FILTERING)
  // ==========================================
  const exactTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    const matchTahun = filterTahun === "Semua" || d.getFullYear().toString() === filterTahun;
    const matchBulan = filterBulan === "Semua" || (d.getMonth() + 1).toString() === filterBulan;
    return matchTahun && matchBulan;
  });

  const cumulativeTransactions = transactions.filter(t => {
    if (filterTahun === "Semua") return true;
    const d = new Date(t.date);
    const tTahun = d.getFullYear();
    const tBulan = d.getMonth() + 1;
    const selTahun = parseInt(filterTahun);
    
    if (tTahun < selTahun) return true;
    if (tTahun > selTahun) return false;
    if (filterBulan === "Semua") return true;
    return tBulan <= parseInt(filterBulan);
  });

  // ==========================================
  // EXCEL ENGINE: AUTOMATIC CALCULATIONS
  // ==========================================
  const getSum = (arr: Transaction[], cat: string, t: 'Masuk' | 'Keluar') => 
    arr.filter(tx => tx.category === cat && tx.type === t).reduce((sum, tx) => sum + tx.amount, 0);

  const bakiTunaiTerkumpul = cumulativeTransactions.filter(t => t.type === 'Masuk').reduce((sum, t) => sum + t.amount, 0) 
                           - cumulativeTransactions.filter(t => t.type === 'Keluar').reduce((sum, t) => sum + t.amount, 0);

  const jualan = getSum(exactTransactions, "Hasil Jualan", "Masuk");
  const jumlahPerbelanjaan = SENARAI_PERBELANJAAN.reduce((total, cat) => total + getSum(exactTransactions, cat, 'Keluar'), 0);
  const untungBersih = jualan - jumlahPerbelanjaan;

  // --- ASSETS TRACKING (With new Penghutang calculation engine) ---
  const peralatan = getSum(cumulativeTransactions, "Peralatan", "Keluar"); 
  const kenderaan = getSum(cumulativeTransactions, "Kenderaan", "Keluar"); 
  const perabot = getSum(cumulativeTransactions, "Perabot", "Keluar"); 
  const penghutang = getSum(cumulativeTransactions, "Penghutang", "Masuk") - getSum(cumulativeTransactions, "Penghutang", "Keluar");
  
  const jumlahAset = bakiTunaiTerkumpul + peralatan + kenderaan + perabot + penghutang;

  // --- LIABILITI & EKUITI ---
  const pemiutang = Math.abs(getSum(cumulativeTransactions, "Pemiutang", "Masuk") - getSum(cumulativeTransactions, "Pemiutang", "Keluar")); 
  const pinjaman = Math.abs(getSum(cumulativeTransactions, "Pinjaman", "Masuk") - getSum(cumulativeTransactions, "Pinjaman", "Keluar"));
  
  const modal = getSum(cumulativeTransactions, "Modal", "Masuk");
  const ambilan = getSum(cumulativeTransactions, "Ambilan", "Keluar");
  
  const jualanKumpul = getSum(cumulativeTransactions, "Hasil Jualan", "Masuk");
  const belanjaKumpul = SENARAI_PERBELANJAAN.reduce((total, cat) => total + getSum(cumulativeTransactions, cat, 'Keluar'), 0);
  const untungTerkumpulKunci = jualanKumpul - belanjaKumpul;

  const jumlahLiabilitiEkuiti = pemiutang + pinjaman + modal + untungTerkumpulKunci - ambilan;

  // ==========================================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description || !amount) return;

    addTransaction({
      date,
      description,
      amount: parseFloat(amount),
      type,
      category,
      nota: nota || undefined
    });

    setDescription("");
    setAmount("");
    setNota("");
  };

  const handleSaveCompanyName = () => {
    if (newCompanyName.trim() !== "") {
      setCompanyName(newCompanyName);
      setIsEditingCompany(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-6 shadow-sm border-b border-gray-100 flex justify-between items-center sticky top-0 z-20">
        <div className="flex-1 mr-2">
          {isEditingCompany ? (
            <div className="flex gap-2 items-center max-w-xs">
              <input 
                type="text" 
                value={newCompanyName} 
                onChange={(e) => setNewCompanyName(e.target.value)} 
                className="border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 w-full focus:outline-none focus:border-blue-500"
                placeholder="Nama Syarikat Baru"
                autoFocus
              />
              <button type="button" onClick={handleSaveCompanyName} className="bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-green-700">Simpan</button>
              <button type="button" onClick={() => { setIsEditingCompany(false); setNewCompanyName(companyName); }} className="text-gray-400 text-xs hover:text-gray-600">Batal</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-900 break-all">{companyName}</h1>
              <button 
                type="button"
                onClick={() => setIsEditingCompany(true)} 
                className="text-gray-400 hover:text-blue-600 text-xs p-1 rounded-full hover:bg-gray-100 transition-all"
                title="Tukar nama syarikat"
              >
                ⚙️
              </button>
            </div>
          )}
          <p className="text-xs sm:text-sm text-gray-500">Sistem Perakaunan Bersepadu</p>
        </div>
        <div className="text-right min-w-[90px]">
          <p className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wider">Tunai Semasa</p>
          <p className={`text-lg sm:text-2xl font-bold ${bakiTunaiTerkumpul >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            RM {bakiTunaiTerkumpul.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 shadow-sm border-b border-gray-200 flex gap-2 justify-center sticky top-[72px] sm:top-[88px] z-10">
        <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="border rounded px-3 py-1 text-sm bg-gray-50">
          <option value="Semua">Semua Bulan</option>
          <option value="1">Januari</option><option value="2">Februari</option>
          <option value="3">Mac</option><option value="4">April</option>
          <option value="5">Mei</option><option value="6">Jun</option>
          <option value="7">Julai</option><option value="8">Ogos</option>
          <option value="9">September</option><option value="10">Oktober</option>
          <option value="11">November</option><option value="12">Disember</option>
        </select>
        <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="border rounded px-3 py-1 text-sm bg-gray-50">
          <option value="Semua">Semua Tahun</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6 mt-2">
        
        {/* --- TAB 1: TRANSAKSI (DATA ENTRY) --- */}
        {activeTab === 'transaksi' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="font-semibold text-lg text-gray-800 border-b pb-2">Rekod Baru</h2>
              
              <div className="space-y-3">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 text-sm" required />
                <input type="text" placeholder="Butiran (Cth: Jualan runcit)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 text-sm" required />
                <input type="number" step="0.01" placeholder="Jumlah (RM)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 text-sm" required />
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <select value={type} onChange={(e) => setType(e.target.value as 'Masuk' | 'Keluar')} className="w-full sm:w-1/3 border border-gray-200 rounded-xl p-3 bg-gray-50 text-sm">
                    <option value="Masuk">Masuk (+)</option>
                    <option value="Keluar">Keluar (-)</option>
                  </select>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full sm:w-2/3 border border-gray-200 rounded-xl p-3 bg-gray-50 text-sm">
                    
                    <optgroup label="Pendapatan & Ekuiti Pemilik">
                      <option value="Hasil Jualan">Hasil Jualan</option>
                      <option value="Modal">Modal Pemilik</option>
                      <option value="Ambilan">Ambilan</option>
                    </optgroup>
                    
                    <optgroup label="Perbelanjaan">
                      {SENARAI_PERBELANJAAN.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </optgroup>
                    
                    {/* ADDED: Aset: Penghutang dropdown category option here */}
                    <optgroup label="Aset & Liabiliti">
                      <option value="Peralatan">Aset: Peralatan</option>
                      <option value="Kenderaan">Aset: Kenderaan</option>
                      <option value="Perabot">Aset: Perabot</option>
                      <option value="Penghutang">Aset: Penghutang</option>
                      <option value="Pinjaman">Liabiliti: Pinjaman</option>
                      <option value="Pemiutang">Liabiliti: Pemiutang</option>
                    </optgroup>
                  </select>
                </div>
                
                <textarea 
                  placeholder="Nota Tambahan (Pilihan)" 
                  value={nota} 
                  onChange={(e) => setNota(e.target.value)} 
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 text-sm resize-none" 
                  rows={2}
                />
              </div>
              
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md">
                Simpan Transaksi
              </button>
            </form>

            <div className="space-y-2">
              <div className="flex justify-between items-end ml-1">
                <h3 className="text-sm font-semibold text-gray-500">SEJARAH TRANSAKSI</h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded">Berdasarkan Filter</span>
              </div>
              
              {exactTransactions.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">Tiada rekod untuk tempoh ini.</p>
              ) : (
                exactTransactions.slice().reverse().map((t) => (
                  <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{t.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{t.date} • <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-600">{t.category}</span></p>
                        {t.nota && <p className="text-xs text-gray-500 mt-2 bg-yellow-50 p-2 rounded border border-yellow-100 italic">" {t.nota} "</p>}
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className={`font-bold ${t.type === 'Masuk' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'Masuk' ? '+' : '-'} {t.amount.toFixed(2)}
                        </p>
                        <button type="button" onClick={() => deleteTransaction(t.id)} className="text-[10px] text-red-400 hover:text-red-600 mt-2">Padam</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2: PENYATA UNTUNG RUGI --- */}
        {activeTab === 'untung' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in duration-500">
            <div className="text-center border-b pb-4">
              <h2 className="text-xl font-bold">Penyata Untung Rugi</h2>
              <p className="text-sm font-medium text-blue-900 mt-0.5">{companyName}</p>
              <p className="text-xs text-gray-500 mt-1">
                {filterBulan !== "Semua" ? `Bulan ${filterBulan}, ` : "Semua Bulan, "} 
                {filterTahun !== "Semua" ? filterTahun : "Semua Tahun"}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="font-bold text-gray-700">Pendapatan</p>
              <div className="flex justify-between text-sm"><p>Jualan / Hasil</p><p>RM {jualan.toFixed(2)}</p></div>
              <div className="border-t pt-2 flex justify-between font-bold text-green-700">
                <p>Jumlah Pendapatan</p><p>RM {jualan.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <p className="font-bold text-gray-700">Perbelanjaan</p>
              {SENARAI_PERBELANJAAN.map(cat => {
                const amount = getSum(exactTransactions, cat, 'Keluar');
                if (amount === 0) return null;
                return <div key={cat} className="flex justify-between text-sm text-gray-600"><p>{cat}</p><p>RM {amount.toFixed(2)}</p></div>
              })}
              {jumlahPerbelanjaan === 0 && <p className="text-xs text-gray-400 italic">Tiada perbelanjaan direkodkan.</p>}
              <div className="border-t pt-2 flex justify-between font-bold text-red-600">
                <p>Jumlah Perbelanjaan</p><p>RM {jumlahPerbelanjaan.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t-4 border-double pt-4 mt-6 flex justify-between text-lg font-black">
              <p>UNTUNG BERSIH</p>
              <p className={untungBersih >= 0 ? "text-green-600" : "text-red-600"}>RM {untungBersih.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* --- TAB 3: PENYATA KEDUDUKAN KEWANGAN --- */}
        {activeTab === 'kewangan' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in duration-500">
             <div className="text-center border-b pb-4">
              <h2 className="text-xl font-bold">Kedudukan Kewangan</h2>
              <p className="text-sm font-medium text-blue-900 mt-0.5">{companyName}</p>
              <p className="text-[10px] text-gray-400 mt-1 italic">
                (Kumulatif sehingga {filterBulan !== "Semua" ? `Bulan ${filterBulan} ` : "akhir "} 
                {filterTahun !== "Semua" ? filterTahun : ""})
              </p>
            </div>
            
            {/* Aset */}
            <div className="space-y-2">
              <p className="font-bold text-blue-800 bg-blue-50 p-2 rounded text-sm">ASET (Harta)</p>
              <div className="flex justify-between text-sm px-2"><p>Tunai Semasa</p><p>RM {bakiTunaiTerkumpul.toFixed(2)}</p></div>
              <div className="flex justify-between text-sm px-2"><p>Peralatan</p><p>RM {peralatan.toFixed(2)}</p></div>
              <div className="flex justify-between text-sm px-2"><p>Kenderaan</p><p>RM {kenderaan.toFixed(2)}</p></div>
              <div className="flex justify-between text-sm px-2"><p>Perabot</p><p>RM {perabot.toFixed(2)}</p></div>
              
              {/* DISPLAY: Dynamic Penghutang line item added here */}
              {penghutang !== 0 && (
                <div className="flex justify-between text-sm px-2"><p>Penghutang</p><p>RM {penghutang.toFixed(2)}</p></div>
              )}
              
              <div className="border-t pt-2 mt-2 flex justify-between font-bold px-2">
                <p>JUMLAH ASET</p><p>RM {jumlahAset.toFixed(2)}</p>
              </div>
            </div>

            {/* Liabiliti & Ekuiti */}
            <div className="space-y-2">
              <p className="font-bold text-purple-800 bg-purple-50 p-2 rounded text-sm">LIABILITI & EKUITI</p>
              <div className="flex justify-between text-sm px-2"><p>Modal Pemilik</p><p>RM {modal.toFixed(2)}</p></div>
              <div className="flex justify-between text-sm px-2 text-green-700"><p>Untung Terkumpul</p><p>RM {untungTerkumpulKunci.toFixed(2)}</p></div>
              <div className="flex justify-between text-sm px-2 text-red-500"><p>Ambilan</p><p>RM {ambilan.toFixed(2)}</p></div>
              <div className="flex justify-between text-sm px-2"><p>Pinjaman Bank</p><p>RM {pinjaman.toFixed(2)}</p></div>
              <div className="flex justify-between text-sm px-2"><p>Pemiutang</p><p>RM {pemiutang.toFixed(2)}</p></div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold px-2">
                <p>JUMLAH L & E</p><p>RM {jumlahLiabilitiEkuiti.toFixed(2)}</p>
              </div>
            </div>
            
            {/* Imbangan Check */}
            <div className={`p-3 rounded-lg text-center font-bold text-sm ${Math.round(jumlahAset) === Math.round(jumlahLiabilitiEkuiti) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {Math.round(jumlahAset) === Math.round(jumlahLiabilitiEkuiti) ? '✅ Penyata Seimbang (Balanced)' : '❌ Penyata Tidak Seimbang'}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-30">
        <button type="button" onClick={() => setActiveTab('transaksi')} className={`flex flex-col items-center p-2 ${activeTab === 'transaksi' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-xl">✍️</span>
          <span className="text-[10px] font-bold mt-1">Rekod</span>
        </button>
        <button type="button" onClick={() => setActiveTab('untung')} className={`flex flex-col items-center p-2 ${activeTab === 'untung' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-xl">📊</span>
          <span className="text-[10px] font-bold mt-1">Untung Rugi</span>
        </button>
        <button type="button" onClick={() => setActiveTab('kewangan')} className={`flex flex-col items-center p-2 ${activeTab === 'kewangan' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-xl">🏛️</span>
          <span className="text-[10px] font-bold mt-1">Kewangan</span>
        </button>
      </div>

    </main>
  );
}