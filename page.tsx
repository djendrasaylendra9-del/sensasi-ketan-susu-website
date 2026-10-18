 "use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { ShoppingBag, Plus, Minus, X, Settings, MapPin, Clock, ArrowRight, Check, Truck, Coffee, Instagram, Phone, Pencil, Trash2, Save, ChevronDown } from "lucide-react";

type Product = { id: string; name: string; description: string; price: number; category: string; image: string; available: boolean };
type Courier = { id: string; name: string; description: string; phone: string; area: string; fee: number | null; eta: string; active: boolean };
type CartLine = { product: Product; qty: number };
type SiteSettings = { brand: string; tagline: string; location: string; whatsapp: string; openHours: string; announcement: string };

const starterProducts: Product[] = [
  { id: "p1", name: "Ketan Susu Keju Original", description: "Ketan pulen, susu creamy, dan taburan keju gurih.", price: 10000, category: "Favorit", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=85", available: true },
  { id: "p2", name: "Ketan Susu Cokelat", description: "Perpaduan ketan hangat, susu, dan cokelat manis.", price: 12000, category: "Cokelat", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85", available: true },
];
const starterCouriers: Courier[] = [
  { id: "c1", name: "Kurir Lokal", description: "Pengantaran sekitar area Jatibarang.", phone: "", area: "Jatibarang dan sekitar", fee: null, eta: "Konfirmasi admin", active: true },
  { id: "c2", name: "Jasa Antar Mitra", description: "Pilih mitra antar lokal sesuai kebutuhan.", phone: "", area: "Area sesuai kesepakatan", fee: null, eta: "Konfirmasi admin", active: true },
];
const defaultSettings: SiteSettings = { brand: "SENSASI KETAN SUSU", tagline: "Manisnya sederhana, rasanya bikin rindu.", location: "Jatibarang", whatsapp: "08985751300", openHours: "Setiap hari • Konfirmasi jam operasional", announcement: "Ketan hangat, topping melimpah, dibuat dengan hati." };
const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const cleanPhone = (n: string) => n.replace(/\D/g, "").replace(/^0/, "62");
const makeId = () => `SKS-${Date.now().toString().slice(-8)}`;

export default function Home() {
  const [products, setProducts] = useState<Product[]>(starterProducts);
  const [couriers, setCouriers] = useState<Courier[]>(starterCouriers);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<"products" | "couriers" | "settings">("products");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [notice, setNotice] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "", area: "Jatibarang", landmark: "", note: "" });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sks-products"); if (saved) setProducts(JSON.parse(saved));
      const savedC = localStorage.getItem("sks-couriers"); if (savedC) setCouriers(JSON.parse(savedC));
      const savedS = localStorage.getItem("sks-settings"); if (savedS) setSettings({ ...defaultSettings, ...JSON.parse(savedS) });
      const savedCart = localStorage.getItem("sks-cart"); if (savedCart) setCart(JSON.parse(savedCart));
    } catch {}
  }, []);

  useEffect(() => {
    if (supabaseConfigured && supabase) {
      (async () => {
        const [p, c, s] = await Promise.all([
          supabase!.from("products").select("*").order("created_at", { ascending: true }),
          supabase!.from("delivery_services").select("*").order("created_at", { ascending: true }),
          supabase!.from("site_settings").select("*").eq("id", "main").maybeSingle()
        ]);
        if (p.data?.length) setProducts(p.data.map((x: any) => ({ id: x.id, name: x.name, description: x.description || "", price: x.price, category: x.category || "Menu", image: x.image_url || "", available: x.available })));
        if (c.data?.length) setCouriers(c.data.map((x: any) => ({ id: x.id, name: x.name, description: x.description || "", phone: x.phone || "", area: x.area || "", fee: x.fee, eta: x.eta || "Konfirmasi admin", active: x.active })));
        if (s.data?.settings) setSettings({ ...defaultSettings, ...s.data.settings });
      })();
    }
  }, []);

  useEffect(() => { localStorage.setItem("sks-products", JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem("sks-couriers", JSON.stringify(couriers)); }, [couriers]);
  useEffect(() => { localStorage.setItem("sks-settings", JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem("sks-cart", JSON.stringify(cart)); }, [cart]);

  const categories = ["Semua", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const filteredProducts = products.filter(p => (category === "Semua" || p.category === category) && `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()));
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const courier = couriers.find(c => c.id === selectedCourier && c.active);
  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const total = subtotal + (courier?.fee ?? 0);

  const addToCart = (product: Product) => {
    if (!product.available) return;
    setCart(old => {
      const found = old.find(line => line.product.id === product.id);
      return found ? old.map(line => line.product.id === product.id ? { ...line, qty: line.qty + 1 } : line) : [...old, { product, qty: 1 }];
    });
    setNotice(`${product.name} ditambahkan ke keranjang`);
    setTimeout(() => setNotice(""), 2400);
  };
  const updateQty = (id: string, delta: number) => setCart(old => old.map(line => line.product.id === id ? { ...line, qty: line.qty + delta } : line).filter(line => line.qty > 0));
  const saveProduct = async () => {
    if (!editingProduct || !editingProduct.name.trim() || editingProduct.price < 0) return setNotice("Periksa nama dan harga produk.");
    setLoading(true);
    if (supabaseConfigured && supabase) {
      const row = { name: editingProduct.name, description: editingProduct.description, price: editingProduct.price, category: editingProduct.category, image_url: editingProduct.image, available: editingProduct.available };
      const result = editingProduct.id.startsWith("new-") ? await supabase.from("products").insert(row).select().single() : await supabase.from("products").update(row).eq("id", editingProduct.id).select().single();
      if (result.error) { setNotice("Gagal menyimpan ke database: " + result.error.message); setLoading(false); return; }
      const saved = result.data;
      const normalized = { ...editingProduct, id: saved.id };
      setProducts(old => editingProduct.id.startsWith("new-") ? [...old, normalized] : old.map(p => p.id === editingProduct.id ? normalized : p));
    } else {
      setProducts(old => editingProduct.id.startsWith("new-") ? [...old, editingProduct] : old.map(p => p.id === editingProduct.id ? editingProduct : p));
      setNotice("Tersimpan di browser ini. Hubungkan Supabase untuk penyimpanan online.");
    }
    setEditingProduct(null); setLoading(false);
  };
  const deleteProduct = async (p: Product) => {
    if (!confirm(`Hapus ${p.name}?`)) return;
    if (supabaseConfigured && supabase && !p.id.startsWith("new-")) {
      const r = await supabase.from("products").delete().eq("id", p.id);
      if (r.error) return setNotice("Gagal menghapus: " + r.error.message);
    }
    setProducts(old => old.filter(x => x.id !== p.id));
  };
  const saveCourier = async () => {
    if (!editingCourier || !editingCourier.name.trim()) return setNotice("Nama jasa pengiriman wajib diisi.");
    setLoading(true);
    if (supabaseConfigured && supabase) {
      const row = { name: editingCourier.name, description: editingCourier.description, phone: editingCourier.phone, area: editingCourier.area, fee: editingCourier.fee, eta: editingCourier.eta, active: editingCourier.active };
      const result = editingCourier.id.startsWith("new-") ? await supabase.from("delivery_services").insert(row).select().single() : await supabase.from("delivery_services").update(row).eq("id", editingCourier.id).select().single();
      if (result.error) { setNotice("Gagal menyimpan jasa: " + result.error.message); setLoading(false); return; }
      const normalized = { ...editingCourier, id: result.data.id };
      setCouriers(old => editingCourier.id.startsWith("new-") ? [...old, normalized] : old.map(c => c.id === editingCourier.id ? normalized : c));
    } else {
      setCouriers(old => editingCourier.id.startsWith("new-") ? [...old, editingCourier] : old.map(c => c.id === editingCourier.id ? editingCourier : c));
      setNotice("Jasa tersimpan di browser ini. Hubungkan Supabase untuk penyimpanan online.");
    }
    setEditingCourier(null); setLoading(false);
  };
  const deleteCourier = async (c: Courier) => {
    if (!confirm(`Hapus jasa ${c.name}?`)) return;
    if (supabaseConfigured && supabase && !c.id.startsWith("new-")) {
      const r = await supabase.from("delivery_services").delete().eq("id", c.id);
      if (r.error) return setNotice("Gagal menghapus: " + r.error.message);
    }
    setCouriers(old => old.filter(x => x.id !== c.id));
  };
  const saveSettings = async () => {
    setLoading(true);
    if (supabaseConfigured && supabase) {
      const result = await supabase.from("site_settings").upsert({ id: "main", settings });
      if (result.error) { setNotice("Gagal menyimpan pengaturan: " + result.error.message); setLoading(false); return; }
      setNotice("Pengaturan tersimpan di database online.");
    } else setNotice("Pengaturan tersimpan di browser ini. Hubungkan Supabase untuk menyimpan online.");
    setLoading(false);
  };
  const submitOrder = async () => {
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim() || !courier || !cart.length) return setNotice("Lengkapi nama, nomor WhatsApp, alamat, keranjang, dan pilih jasa antar.");
    const orderId = makeId();
    const feeText = courier.fee == null ? "Konfirmasi melalui WhatsApp" : money(courier.fee);
    const totalText = courier.fee == null ? `${money(subtotal)} + ongkir (konfirmasi)` : money(total);
    const message = [
      `PESANAN BARU — ${settings.brand}`, `Nomor pesanan: ${orderId}`, "",
      "DATA PELANGGAN", `Nama: ${customer.name}`, `WhatsApp: ${customer.phone}`, `Alamat: ${customer.address}`, `Area: ${customer.area}`, `Patokan: ${customer.landmark || "-"}`, "",
      "DETAIL PESANAN", ...cart.map(l => `• ${l.product.name} x${l.qty} — ${money(l.product.price * l.qty)}`), "",
      `Subtotal makanan: ${money(subtotal)}`, `Jasa pengiriman: ${courier.name}`, `Ongkos kirim: ${feeText}`, `Total: ${totalText}`, `Catatan: ${customer.note || "-"}`, "",
      "Mohon konfirmasi ketersediaan, ongkir, dan pesanan ini."
    ].join("\n");
    if (supabaseConfigured && supabase) {
      const order = await supabase.from("orders").insert({
        order_number: orderId, customer_name: customer.name, customer_phone: customer.phone,
        address: customer.address, area: customer.area, landmark: customer.landmark, note: customer.note,
        delivery_service_id: courier.id, delivery_service_name: courier.name, subtotal, delivery_fee: courier.fee,
        total: courier.fee == null ? subtotal : total, status: "pending", items: cart.map(l => ({ product_id: l.product.id, name: l.product.name, price: l.product.price, qty: l.qty }))
      });
      if (order.error) { setNotice("Pesanan belum tersimpan di database. " + order.error.message); return; }
    } else {
      const oldOrders = JSON.parse(localStorage.getItem("sks-orders") || "[]");
      localStorage.setItem("sks-orders", JSON.stringify([{ orderId, customer, cart, courier, subtotal, total: courier.fee == null ? null : total, status: "pending", createdAt: new Date().toISOString() }, ...oldOrders]));
    }
    const url = `https://wa.me/${cleanPhone(settings.whatsapp)}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setCheckoutOpen(false); setCartOpen(false); setCart([]); setCustomer({ name: "", phone: "", address: "", area: "Jatibarang", landmark: "", note: "" });
    setNotice(`Pesanan ${orderId} disiapkan. Lanjutkan konfirmasi di WhatsApp.`);
  };

  return (
    <main>
      <div className="announcement"><span>{settings.announcement}</span><span className="announcement-right"><MapPin size={13}/> {settings.location}</span></div>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Sensasi Ketan Susu beranda"><span className="brand-mark"><Coffee size={24}/></span><span><b>{settings.brand}</b><small>MANISNYA BIKIN RINDU</small></span></a>
        <nav><a href="#menu">Menu</a><a href="#delivery">Jasa Antar</a><a href="#story">Tentang Kami</a></nav>
        <div className="header-actions"><button className="icon-btn" onClick={() => setCartOpen(true)} aria-label="Buka keranjang"><ShoppingBag size={19}/><span className="cart-count">{itemCount}</span></button><button className="admin-link" onClick={() => {setAdminOpen(true);setAdminUnlocked(false);}}> <Settings size={16}/> Admin</button></div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot"/> HANGAT • LEMBUT • PENUH RASA</span>
          <h1>Manisnya sederhana,<br/><em>rasanya bikin rindu.</em></h1>
          <p>Ketan pulen berpadu susu creamy dan topping favorit. Teman santai yang selalu bikin ingin kembali.</p>
          <div className="hero-actions"><a className="btn-primary" href="#menu">Jelajahi Menu <ArrowRight size={17}/></a><a className="btn-text" href="#delivery">Lihat pilihan antar</a></div>
          <div className="hero-notes"><span><Check size={15}/> Dibuat saat dipesan</span><span><Check size={15}/> Pesan via WhatsApp</span></div>
        </div>
        <div className="hero-visual"><div className="hero-photo" role="img" aria-label="Hidangan manis dengan topping"></div><div className="hero-sticker"><span>GOOD</span><b>MOOD</b><small>IN EVERY BITE</small></div><div className="hero-caption"><span className="caption-line"></span><span>Comfort food, made with love.</span></div></div>
        <div className="hero-bottom"><span>01 / KETAN SUSU FAVORIT</span><span>SCROLL TO DISCOVER ↓</span></div>
      </section>

      <section className="intro-strip" id="story"><div className="intro-label">CERITA KAMI</div><p>Kami percaya, kebahagiaan kecil bisa datang dari semangkuk ketan susu yang hangat, lembut, dan dibuat sepenuh hati.</p><div className="intro-signature">Dari kami, untuk momen manismu.</div></section>

      <section className="menu-section section-pad" id="menu">
        <div className="section-top"><div><span className="eyebrow">PILIHAN YANG BIKIN HAPPY</span><h2>Menu <em>favorit.</em></h2></div><div className="search-wrap"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari menu..." aria-label="Cari menu"/><span>⌕</span></div></div>
        <div className="category-row">{categories.map(c=><button key={c} className={`category-pill ${category===c?"active":""}`} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <div className="product-grid">{filteredProducts.map((p,i)=><article className="product-card" key={p.id}><div className="product-image-wrap"><img className="product-image" src={p.image || "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=85"} alt={p.name}/><span className="product-index">0{i+1}</span>{!p.available&&<span className="sold-out">HABIS</span>}<button className="quick-add" disabled={!p.available} onClick={()=>addToCart(p)} aria-label={`Tambah ${p.name}`}><Plus size={20}/></button></div><div className="product-info"><span className="product-category">{p.category}</span><h3>{p.name}</h3><p>{p.description}</p><div className="product-bottom"><strong>{money(p.price)}</strong><button onClick={()=>addToCart(p)} disabled={!p.available}>{p.available?"Tambah":"Habis"} <ArrowRight size={14}/></button></div></div></article>)}</div>
        {!filteredProducts.length&&<div className="empty-state">Menu belum ditemukan. Coba kata kunci lain.</div>}
      </section>

      <section className="delivery-section section-pad" id="delivery"><div className="delivery-copy"><span className="eyebrow">SAMPAI KE DEPAN PINTU</span><h2>Pesan enak,<br/><em>antar gampang.</em></h2><p>Pilih jasa pengiriman lokal yang paling cocok untukmu. Ongkir dan jangkauan akan dikonfirmasi sesuai layanan yang tersedia.</p><a className="btn-light" href="#menu">Pilih menu dulu <ArrowRight size={16}/></a></div><div className="delivery-options"><div className="delivery-heading"><span>MITRA PENGANTARAN</span><span>{couriers.filter(c=>c.active).length} PILIHAN AKTIF</span></div>{couriers.filter(c=>c.active).map((c,i)=><div className="delivery-card" key={c.id}><div className="delivery-icon"><Truck size={21}/></div><div className="delivery-detail"><h3>{c.name}</h3><p>{c.description}</p><small><MapPin size={12}/> {c.area || "Area dikonfirmasi admin"}</small></div><div className="delivery-fee">{c.fee==null?"Konfirmasi":money(c.fee)}<small>{c.eta}</small></div></div>)}{!couriers.some(c=>c.active)&&<div className="empty-delivery">Pilihan jasa antar akan segera tersedia.</div>}<div className="delivery-footnote">Pilihan jasa dan tarif dapat berubah sesuai area serta ketersediaan kurir.</div></div></section>

      <section className="closing section-pad"><span className="eyebrow">MOMEN MANIS DIMULAI DI SINI</span><h2>Satu sendok,<br/><em>langsung jatuh hati.</em></h2><a className="btn-primary" href="#menu">Pesan favoritmu <ArrowRight size={17}/></a><div className="closing-ornament">✳</div></section>
      <footer className="footer"><div className="footer-brand"><span className="brand-mark"><Coffee size={22}/></span><div><b>{settings.brand}</b><small>{settings.tagline}</small></div></div><div className="footer-info"><span><MapPin size={14}/> {settings.location}</span><span><Clock size={14}/> {settings.openHours}</span><a href={`https://wa.me/${cleanPhone(settings.whatsapp)}`} target="_blank" rel="noreferrer"><Phone size={14}/> WhatsApp pemesanan</a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.brand}. Dibuat dengan sepenuh hati.</span><span>MANIS • HANGAT • BERKESAN</span></div></footer>

      {notice&&<div className="toast" role="status">{notice}<button onClick={()=>setNotice("")} aria-label="Tutup notifikasi"><X size={14}/></button></div>}

      {cartOpen&&<div className="overlay" onClick={()=>setCartOpen(false)}><aside className="side-panel" onClick={e=>e.stopPropagation()}><div className="panel-heading"><div><span className="eyebrow">PESANANMU</span><h2>Keranjang <em>belanja</em></h2></div><button className="close-btn" onClick={()=>setCartOpen(false)} aria-label="Tutup"><X/></button></div>{cart.length===0?<div className="empty-state">Keranjangmu masih kosong.<button className="btn-primary" onClick={()=>{setCartOpen(false);document.getElementById("menu")?.scrollIntoView({behavior:"smooth"})}}>Lihat menu</button></div>:<><div className="cart-lines">{cart.map(l=><div className="cart-line" key={l.product.id}><img src={l.product.image} alt=""/><div className="cart-line-info"><b>{l.product.name}</b><span>{money(l.product.price)}</span><div className="qty-control"><button onClick={()=>updateQty(l.product.id,-1)} aria-label="Kurangi"><Minus size={13}/></button><span>{l.qty}</span><button onClick={()=>updateQty(l.product.id,1)} aria-label="Tambah"><Plus size={13}/></button></div></div><strong>{money(l.product.price*l.qty)}</strong></div>)}</div><div className="cart-total"><span>Subtotal</span><b>{money(subtotal)}</b></div><button className="btn-primary full" onClick={()=>{setCartOpen(false);setCheckoutOpen(true)}}>Lanjut checkout <ArrowRight size={16}/></button></>}</aside></div>}

      {checkoutOpen&&<div className="overlay" onClick={()=>setCheckoutOpen(false)}><section className="modal checkout-modal" onClick={e=>e.stopPropagation()}><div className="panel-heading"><div><span className="eyebrow">TINGGAL SELANGKAH LAGI</span><h2>Detail <em>pesanan.</em></h2></div><button className="close-btn" onClick={()=>setCheckoutOpen(false)} aria-label="Tutup"><X/></button></div><div className="checkout-grid"><div className="form-fields"><label>Nama lengkap<input value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} placeholder="Nama penerima"/></label><label>Nomor WhatsApp<input value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})} placeholder="08xxxxxxxxxx" inputMode="tel"/></label><label>Alamat lengkap<textarea value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})} placeholder="Nama jalan, nomor rumah, RT/RW..." rows={2}/></label><label>Area pengantaran<input value={customer.area} onChange={e=>setCustomer({...customer,area:e.target.value})} placeholder="Kecamatan / desa"/></label><label>Patokan lokasi <span className="optional">(opsional)</span><input value={customer.landmark} onChange={e=>setCustomer({...customer,landmark:e.target.value})} placeholder="Dekat masjid, sekolah, dll."/></label><label>Catatan pesanan <span className="optional">(opsional)</span><textarea value={customer.note} onChange={e=>setCustomer({...customer,note:e.target.value})} placeholder="Catatan untuk penjual" rows={2}/></label></div><div className="checkout-summary"><h3>Ringkasan</h3>{cart.map(l=><div className="summary-line" key={l.product.id}><span>{l.product.name} × {l.qty}</span><b>{money(l.product.price*l.qty)}</b></div>)}<div className="summary-divider"/><div className="summary-line"><span>Subtotal</span><b>{money(subtotal)}</b></div><label className="courier-label">Pilih jasa pengiriman</label><div className="courier-select-list">{couriers.filter(c=>c.active).map(c=><button key={c.id} className={`courier-choice ${selectedCourier===c.id?"selected":""}`} onClick={()=>setSelectedCourier(c.id)}><span className="choice-radio">{selectedCourier===c.id&&<span/>}</span><span className="choice-info"><b>{c.name}</b><small>{c.area}</small></span><strong>{c.fee==null?"Konfirmasi":money(c.fee)}</strong></button>)}</div><div className="summary-line"><span>Ongkos kirim</span><b>{courier?(courier.fee==null?"Konfirmasi":money(courier.fee)):"Pilih jasa"}</b></div><div className="summary-line summary-grand"><span>Total {courier?.fee==null&&courier?"sementara":"pesanan"}</span><b>{courier?.fee==null&&courier?`${money(subtotal)} + ongkir`:money(total)}</b></div><button className="btn-primary full" onClick={submitOrder}>Pesan via WhatsApp <ArrowRight size={16}/></button><small className="privacy-note">Pesanan akan disimpan terlebih dahulu. Admin akan mengonfirmasi ketersediaan dan ongkir.</small></div></div></section></div>}

      {adminOpen&&<div className="overlay admin-overlay" onClick={()=>setAdminOpen(false)}><section className="modal admin-modal" onClick={e=>e.stopPropagation()}><div className="panel-heading"><div><span className="eyebrow">PENGELOLAAN TOKO</span><h2>Admin <em>dashboard.</em></h2></div><button className="close-btn" onClick={()=>setAdminOpen(false)} aria-label="Tutup"><X/></button></div>{!adminUnlocked?<div className="admin-login"><p>Masuk ke panel pengelolaan. Untuk demo awal, masukkan kode admin lokal yang kamu tentukan di browser ini.</p><label>Kode admin<input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Buat kode admin demo"/></label><button className="btn-primary" onClick={()=>{if(adminPassword.trim().length>=4){setAdminUnlocked(true);setNotice("Panel admin terbuka untuk demo browser.");}else setNotice("Masukkan minimal 4 karakter.")}}>Buka dashboard <ArrowRight size={16}/></button><small>Catatan: mode demo tidak menggantikan autentikasi aman. Aktifkan autentikasi Supabase sebelum website dipublikasikan.</small></div>:<><div className="admin-warning">{supabaseConfigured?"Database Supabase terkonfigurasi. Pastikan kebijakan RLS sudah diterapkan.":"Mode demo lokal aktif. Perubahan tersimpan di browser ini saja, belum online."}</div><div className="admin-tabs"><button className={adminTab==="products"?"active":""} onClick={()=>setAdminTab("products")}>Produk</button><button className={adminTab==="couriers"?"active":""} onClick={()=>setAdminTab("couriers")}>Jasa antar</button><button className={adminTab==="settings"?"active":""} onClick={()=>setAdminTab("settings")}>Pengaturan</button></div>{adminTab==="products"&&<div className="admin-content"><div className="admin-content-top"><h3>Daftar menu ({products.length})</h3><button className="small-primary" onClick={()=>setEditingProduct({id:"new-"+Date.now(),name:"",description:"",price:0,category:"Menu",image:"",available:true})}><Plus size={15}/> Tambah menu</button></div>{editingProduct&&<div className="edit-form"><h4>{editingProduct.id.startsWith("new-")?"Tambah produk":"Edit produk"}</h4><label>Nama<input value={editingProduct.name} onChange={e=>setEditingProduct({...editingProduct,name:e.target.value})}/></label><label>Deskripsi<input value={editingProduct.description} onChange={e=>setEditingProduct({...editingProduct,description:e.target.value})}/></label><div className="form-row"><label>Harga (Rp)<input type="number" min="0" value={editingProduct.price} onChange={e=>setEditingProduct({...editingProduct,price:Number(e.target.value)})}/></label><label>Kategori<input value={editingProduct.category} onChange={e=>setEditingProduct({...editingProduct,category:e.target.value})}/></label></div><label>URL foto produk<input value={editingProduct.image} onChange={e=>setEditingProduct({...editingProduct,image:e.target.value})} placeholder="https://..."/></label><label className="checkbox-label"><input type="checkbox" checked={editingProduct.available} onChange={e=>setEditingProduct({...editingProduct,available:e.target.checked})}/> Produk tersedia</label><div className="form-actions"><button className="btn-secondary" onClick={()=>setEditingProduct(null)}>Batal</button><button className="small-primary" onClick={saveProduct} disabled={loading}><Save size={14}/> {loading?"Menyimpan...":"Simpan perubahan"}</button></div></div>}{products.map(p=><div className="admin-row" key={p.id}><img src={p.image} alt=""/><div><b>{p.name}</b><small>{money(p.price)} • {p.available?"Tersedia":"Habis"}</small></div><button onClick={()=>setEditingProduct({...p})} aria-label="Edit produk"><Pencil size={15}/></button><button onClick={()=>deleteProduct(p)} aria-label="Hapus produk"><Trash2 size={15}/></button></div>)}</div>}{adminTab==="couriers"&&<div className="admin-content"><div className="admin-content-top"><h3>Jasa pengiriman ({couriers.length})</h3><button className="small-primary" onClick={()=>setEditingCourier({id:"new-"+Date.now(),name:"",description:"",phone:"",area:"",fee:null,eta:"Konfirmasi admin",active:true})}><Plus size={15}/> Tambah jasa</button></div>{editingCourier&&<div className="edit-form"><h4>{editingCourier.id.startsWith("new-")?"Tambah jasa antar":"Edit jasa antar"}</h4><label>Nama jasa<input value={editingCourier.name} onChange={e=>setEditingCourier({...editingCourier,name:e.target.value})}/></label><label>Deskripsi<input value={editingCourier.description} onChange={e=>setEditingCourier({...editingCourier,description:e.target.value})}/></label><label>Nomor WhatsApp kurir<input value={editingCourier.phone} onChange={e=>setEditingCourier({...editingCourier,phone:e.target.value})}/></label><label>Area layanan<input value={editingCourier.area} onChange={e=>setEditingCourier({...editingCourier,area:e.target.value})}/></label><div className="form-row"><label>Tarif (Rp, kosong = konfirmasi)<input type="number" min="0" value={editingCourier.fee??""} onChange={e=>setEditingCourier({...editingCourier,fee:e.target.value===""?null:Number(e.target.value)})}/></label><label>Estimasi<input value={editingCourier.eta} onChange={e=>setEditingCourier({...editingCourier,eta:e.target.value})}/></label></div><label className="checkbox-label"><input type="checkbox" checked={editingCourier.active} onChange={e=>setEditingCourier({...editingCourier,active:e.target.checked})}/> Tampilkan ke pelanggan</label><div className="form-actions"><button className="btn-secondary" onClick={()=>setEditingCourier(null)}>Batal</button><button className="small-primary" onClick={saveCourier} disabled={loading}><Save size={14}/> Simpan jasa</button></div></div>}{couriers.map(c=><div className="admin-row" key={c.id}><span className="admin-row-icon"><Truck size={18}/></span><div><b>{c.name}</b><small>{c.fee==null?"Ongkir konfirmasi":money(c.fee)} • {c.active?"Aktif":"Nonaktif"}</small></div><button onClick={()=>setEditingCourier({...c})} aria-label="Edit jasa"><Pencil size={15}/></button><button onClick={()=>deleteCourier(c)} aria-label="Hapus jasa"><Trash2 size={15}/></button></div>)}</div>}{adminTab==="settings"&&<div className="admin-content"><h3>Identitas website</h3><div className="edit-form"><label>Nama brand<input value={settings.brand} onChange={e=>setSettings({...settings,brand:e.target.value})}/></label><label>Tagline<input value={settings.tagline} onChange={e=>setSettings({...settings,tagline:e.target.value})}/></label><label>Pengumuman banner<input value={settings.announcement} onChange={e=>setSettings({...settings,announcement:e.target.value})}/></label><div className="form-row"><label>Lokasi<input value={settings.location} onChange={e=>setSettings({...settings,location:e.target.value})}/></label><label>Jam operasional<input value={settings.openHours} onChange={e=>setSettings({...settings,openHours:e.target.value})}/></label></div><label>WhatsApp admin<input value={settings.whatsapp} onChange={e=>setSettings({...settings,whatsapp:e.target.value})}/></label><div className="form-actions"><button className="small-primary" onClick={saveSettings} disabled={loading}><Save size={14}/> {loading?"Menyimpan...":"Simpan pengaturan"}</button></div></div></div>}</>}</section></div>}
    </main>
  );
}
