"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const CATEGORIES = ["식비", "카페", "교통", "쇼핑", "구독", "기타"];
const won = (n) => n.toLocaleString("ko-KR") + "원";
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const empty = () => ({ amount: "", place: "", category: CATEGORIES[0], date: today(), memo: "" });
const sum = (list) => list.reduce((s, i) => s + i.amount, 0);

// 최근 6개월(YYYY-MM), 오래된 달부터
const recentMonths = () => {
  const d = new Date();
  return Array.from({ length: 6 }, (_, k) => {
    const m = new Date(d.getFullYear(), d.getMonth() - 5 + k, 1);
    return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
  });
};

export default function Home() {
  const [pin, setPin] = useState(null); // null = 로그인 전
  const [ready, setReady] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [tab, setTab] = useState("list");
  const [error, setError] = useState("");

  const logout = () => {
    sessionStorage.removeItem("pin");
    setPin(null);
    setItems([]);
  };

  const load = async (p) => {
    const { data, error } = await supabase.rpc("list_expenses", { p_pin: p });
    if (error) {
      logout();
      return setError(error.message === "wrong pin" ? "PIN이 올바르지 않습니다." : error.message);
    }
    setItems(data.sort((a, b) => b.id - a.id));
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("pin");
    if (saved) {
      setPin(saved);
      load(saved);
    }
    setReady(true);
  }, []);

  const login = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.rpc("check_pin", { p_pin: pinInput });
    if (error) return setError(error.message);
    if (!data) return setError("PIN이 올바르지 않습니다.");
    sessionStorage.setItem("pin", pinInput);
    setError("");
    setPin(pinInput);
    setPinInput("");
    load(pinInput);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.rpc("add_expense", {
      p_pin: pin,
      p_amount: Number(form.amount),
      p_place: form.place,
      p_category: form.category,
      p_date: form.date,
      p_memo: form.memo,
    });
    if (error) return setError(error.message);
    setError("");
    setItems([data, ...items]);
    setForm(empty());
  };

  if (!ready) return null;

  if (!pin) {
    return (
      <main>
        <header>
          <h1>★ 서퍼스 가계부 ★</h1>
        </header>
        <form onSubmit={login}>
          <h2>PIN 입력</h2>
          <label>PIN
            <input type="password" inputMode="numeric" required autoFocus value={pinInput} onChange={(e) => setPinInput(e.target.value)} />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit">들어가기</button>
        </form>
      </main>
    );
  }

  const month = today().slice(0, 7);
  const monthItems = items.filter((i) => i.date.startsWith(month));
  const monthTotal = sum(monthItems);

  const byDate = {};
  for (const i of items) (byDate[i.date] ||= []).push(i);
  const dates = Object.keys(byDate).sort().reverse();

  const byCategory = CATEGORIES.map((c) => ({ name: c, total: sum(monthItems.filter((i) => i.category === c)) }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
  const months = recentMonths().map((m) => ({ name: Number(m.slice(5)) + "월", total: sum(items.filter((i) => i.date.startsWith(m))) }));
  const maxMonth = Math.max(...months.map((m) => m.total), 1);

  return (
    <main>
      <header>
        <h1>★ 서퍼스 가계부 ★</h1>
        <p className="label">{Number(month.slice(5))}월 지출 합계</p>
        <p className="total">{won(monthTotal)}</p>
        <button className="link" onClick={logout}>잠그기</button>
      </header>

      <nav>
        <button className={tab === "list" ? "on" : ""} onClick={() => setTab("list")}>내역</button>
        <button className={tab === "stats" ? "on" : ""} onClick={() => setTab("stats")}>통계</button>
      </nav>

      {tab === "list" && (
        <>
          <form onSubmit={submit}>
            <h2>지출 입력</h2>
            <label>금액
              <input type="number" min="1" required inputMode="numeric" value={form.amount} onChange={set("amount")} placeholder="0" />
            </label>
            <label>사용처
              <input required value={form.place} onChange={set("place")} placeholder="예: 스타벅스" />
            </label>
            <label>카테고리
              <select value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>날짜
              <input type="date" required value={form.date} onChange={set("date")} />
            </label>
            <label>메모
              <input value={form.memo} onChange={set("memo")} placeholder="선택" />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit">추가하기</button>
          </form>

          <section>
            <h2>지출 내역</h2>
            {dates.length === 0 && <p className="empty">아직 입력한 지출이 없습니다.</p>}
            {dates.map((d) => (
              <div key={d} className="group">
                <h3>
                  <span>{d}</span>
                  <span>{won(sum(byDate[d]))}</span>
                </h3>
                <ul>
                  {byDate[d].map((i) => (
                    <li key={i.id}>
                      <div>
                        <b>{i.place}</b> <em>{i.category}</em>
                        {i.memo && <small>{i.memo}</small>}
                      </div>
                      <span>{won(i.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </>
      )}

      {tab === "stats" && (
        <>
          <section>
            <h2>이번 달 카테고리별</h2>
            {byCategory.length === 0 && <p className="empty">이번 달 지출이 없습니다.</p>}
            {byCategory.map((c) => (
              <div key={c.name} className="bar-row">
                <div className="bar-head">
                  <b>{c.name}</b>
                  <span>{won(c.total)} ({Math.round((c.total / monthTotal) * 100)}%)</span>
                </div>
                <div className="bar"><i style={{ width: `${(c.total / byCategory[0].total) * 100}%` }} /></div>
              </div>
            ))}
          </section>

          <section>
            <h2>최근 6개월</h2>
            {months.map((m) => (
              <div key={m.name} className="bar-row">
                <div className="bar-head">
                  <b>{m.name}</b>
                  <span>{won(m.total)}</span>
                </div>
                <div className="bar alt"><i style={{ width: `${(m.total / maxMonth) * 100}%` }} /></div>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
