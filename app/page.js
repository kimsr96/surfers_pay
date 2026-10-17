"use client";

import { useState } from "react";

const CATEGORIES = ["식비", "카페", "교통", "쇼핑", "구독", "기타"];
const won = (n) => n.toLocaleString("ko-KR") + "원";
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const empty = () => ({ amount: "", place: "", category: CATEGORIES[0], date: today(), memo: "" });

export default function Home() {
  // ponytail: 저장하지 않음(요청사항). 새로고침하면 사라진다.
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setItems([{ ...form, amount: Number(form.amount), id: Date.now() }, ...items]);
    setForm(empty());
  };

  const month = today().slice(0, 7);
  const monthTotal = items.filter((i) => i.date.startsWith(month)).reduce((s, i) => s + i.amount, 0);

  const byDate = {};
  for (const i of items) (byDate[i.date] ||= []).push(i);
  const dates = Object.keys(byDate).sort().reverse();

  return (
    <main>
      <header>
        <h1>★ 서퍼스 가계부 ★</h1>
        <p className="label">{Number(month.slice(5))}월 지출 합계</p>
        <p className="total">{won(monthTotal)}</p>
      </header>

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
        <button type="submit">추가하기</button>
      </form>

      <section>
        <h2>지출 내역</h2>
        {dates.length === 0 && <p className="empty">아직 입력한 지출이 없습니다.</p>}
        {dates.map((d) => (
          <div key={d} className="group">
            <h3>
              <span>{d}</span>
              <span>{won(byDate[d].reduce((s, i) => s + i.amount, 0))}</span>
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
    </main>
  );
}
