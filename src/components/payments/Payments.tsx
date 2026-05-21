"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Student, Payment, Fee, PaymentMethod } from "@/types";
import Card, { CardHeader } from "@/components/layout/Card";

interface PaymentsProps {
  students: Student[];
  payments: Payment[];
  fees: Fee[];
  onLogPayment: (studentId: number, amount: number, method: PaymentMethod, note?: string) => void;
  onAddFee: (studentId: number, amount: number, note?: string) => void;
}

function totalOwed(studentId: number, fees: Fee[]) {
  return fees.filter(f => f.studentId === studentId).reduce((s, f) => s + f.amount, 0);
}

function totalPaid(studentId: number, payments: Payment[]) {
  return payments.filter(p => p.studentId === studentId).reduce((s, p) => s + p.amount, 0);
}

const eur = (amount: number) => `${amount}€`;

export default function Payments({ students, payments, fees, onLogPayment, onAddFee }: PaymentsProps) {
  const [manageStudent, setManageStudent] = useState<Student | null>(null);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<"fee" | "payment">("fee");

  const [feeAmount, setFeeAmount] = useState("");
  const [feeNote, setFeeNote] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.childFullName.toLowerCase().includes(q) ||
      s.parentFullName.toLowerCase().includes(q) ||
      s.parentPhone.includes(q)
    );
  });

  const grandOwed = students.reduce((s, x) => s + totalOwed(x.id, fees), 0);
  const grandPaid = payments.reduce((s, p) => s + p.amount, 0);
  const grandRemaining = grandOwed - grandPaid;

  const stats = [
    { label: "Total expected",  value: eur(grandOwed),      color: "text-gray-900" },
    { label: "Total collected", value: eur(grandPaid),      color: "text-emerald-700" },
    { label: "Remaining",       value: eur(grandRemaining), color: grandRemaining > 0 ? "text-red-600" : "text-emerald-700" },
    { label: "Students",        value: String(students.length), color: "text-gray-900" },
  ];

  const openManage = (s: Student) => {
    setManageStudent(s);
    setActiveTab("fee");
    setFeeAmount("");
    setFeeNote("");
    setPayAmount("");
    setPayNote("");
    setError("");
  };
  const closeManage = () => { setManageStudent(null); setError(""); };

  const handleAddFee = () => {
    const parsed = parseFloat(feeAmount);
    if (!feeAmount || isNaN(parsed) || parsed === 0) { setError("Please enter a valid amount."); return; }
    if (!manageStudent) return;
    onAddFee(manageStudent.id, parsed, feeNote || undefined);
    closeManage();
  };

  const handleLogPayment = () => {
    if (!manageStudent) return;
    const parsed = parseFloat(payAmount);
    if (!payAmount || isNaN(parsed) || parsed <= 0) { setError("Please enter a valid amount."); return; }
    const remaining = totalOwed(manageStudent.id, fees) - totalPaid(manageStudent.id, payments);
    if (parsed > remaining) { setError(`Amount exceeds remaining balance of ${eur(remaining)}`); return; }
    onLogPayment(manageStudent.id, parsed, manageStudent.paymentMethod, payNote || undefined);
    closeManage();
  };

  // --- Excel export ---
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const summaryRows = students.map(s => {
      const owed      = totalOwed(s.id, fees);
      const paid      = totalPaid(s.id, payments);
      const remaining = owed - paid;
      return {
        "Child":            s.childFullName,
        "Parent":           s.parentFullName,
        "Phone":            s.parentPhone,
        "Payment Method":   s.paymentMethod,
        "Payment Schedule": s.paymentSchedule,
        "Total Owed (€)":   owed,
        "Total Paid (€)":   paid,
        "Remaining (€)":    remaining,
        "Status":           owed === 0 ? "No fees" : remaining === 0 ? "Fully paid" : "Outstanding",
      };
    });
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary["!cols"] = [
      { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 16 },
      { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    type HistoryExportRow = {
      "Date": string;
      "Child": string;
      "Parent": string;
      "Type": string;
      "Amount (€)": number;
      "Method": string;
      "Note": string;
    };

    const historyRows: HistoryExportRow[] = [];

    students.forEach(s => {
      fees
        .filter(f => f.studentId === s.id)
        .forEach(f => {
          historyRows.push({
            "Date":       f.date,
            "Child":      s.childFullName,
            "Parent":     s.parentFullName,
            "Type":       "Fee",
            "Amount (€)": f.amount,
            "Method":     "—",
            "Note":       f.note ?? "",
          });
        });

      payments
        .filter(p => p.studentId === s.id)
        .forEach(p => {
          historyRows.push({
            "Date":       p.date,
            "Child":      s.childFullName,
            "Parent":     s.parentFullName,
            "Type":       "Payment",
            "Amount (€)": p.amount,
            "Method":     p.method,
            "Note":       p.note ?? "",
          });
        });
    });

    historyRows.sort((a, b) => a["Date"] < b["Date"] ? -1 : a["Date"] > b["Date"] ? 1 : 0);

    const wsHistory = XLSX.utils.json_to_sheet(historyRows);
    wsHistory["!cols"] = [
      { wch: 12 }, { wch: 28 }, { wch: 28 },
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 28 },
    ];
    XLSX.utils.book_append_sheet(wb, wsHistory, "History");

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `payments-export-${date}.xlsx`);
  };

  // Merged chronological history for the history modal
  type HistoryRow =
    | { kind: "payment"; date: string; item: Payment }
    | { kind: "fee";     date: string; item: Fee     };

  const buildHistory = (s: Student): HistoryRow[] => {
    const rows: HistoryRow[] = [
      ...payments.filter(p => p.studentId === s.id).map(p => ({ kind: "payment" as const, date: p.date, item: p })),
      ...fees.filter(f => f.studentId === s.id).map(f => ({ kind: "fee" as const, date: f.date, item: f })),
    ];
    rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return rows;
  };

  const inputCls =
    "w-full px-2.5 py-1.5 rounded-lg text-[13px] focus:outline-none transition-colors " +
    "bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500";
  const labelCls = "block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1";

  return (
    <div>
      <h1 className="text-[18px] font-medium text-gray-900 mb-4">Payments</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3">
            <div className="text-[11px] text-gray-400 mb-1">{s.label}</div>
            <div className={`text-[22px] font-medium ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardHeader title="Student payments" />

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-[12px] font-medium hover:bg-gray-50 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Excel
            </button>

            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search child, parent, phone…"
                className="pl-8 pr-8 py-1.5 rounded-lg text-[12px] border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors w-[220px]"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-100">
                {["Child", "Parent", "Parent Phone", "Method", "Schedule", "Paid / Total", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] text-gray-400 font-medium pb-2 pr-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[13px] text-gray-400 italic">
                    No students match &ldquo;{search}&rdquo;
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const owed      = totalOwed(s.id, fees);
                  const paid      = totalPaid(s.id, payments);
                  const remaining = owed - paid;
                  const fullyPaid  = owed > 0 && remaining === 0;
                  const noFeesYet  = owed === 0;

                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-gray-900 whitespace-nowrap">{s.childFullName}</td>
                      <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{s.parentFullName}</td>
                      <td className="py-2.5 pr-4 text-gray-500 whitespace-nowrap">{s.parentPhone}</td>
                      <td className="py-2.5 pr-4 capitalize text-gray-500">{s.paymentMethod}</td>
                      <td className="py-2.5 pr-4 capitalize text-gray-500">{s.paymentSchedule}</td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        {noFeesYet ? (
                          <span className="text-gray-400 italic text-[12px]">No fees yet</span>
                        ) : (
                          <>
                            <span className={fullyPaid ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>{eur(paid)}</span>
                            <span className="text-gray-400"> / {eur(owed)}</span>
                          </>
                        )}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openManage(s)}
                            className={fullyPaid
                              ? "px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-medium hover:bg-emerald-100 transition-colors whitespace-nowrap"
                              : "px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-medium hover:bg-blue-100 transition-colors whitespace-nowrap"}
                          >
                            {noFeesYet ? "+ Add fee" : fullyPaid ? "✓ Manage" : "Manage"}
                          </button>
                          <button
                            onClick={() => setHistoryStudent(s)}
                            className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 text-[11px] font-medium hover:bg-gray-100 transition-colors whitespace-nowrap border border-gray-200"
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {search && filteredStudents.length > 0 && (
            <p className="text-[11px] text-gray-400 mt-2 px-0.5">{filteredStudents.length} of {students.length} students</p>
          )}
        </div>
      </Card>

      {/* Manage modal */}
      {manageStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeManage}>
          <div className="bg-white rounded-xl border border-gray-200 p-5 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] font-semibold text-gray-800 mb-0.5">Manage</p>
            <p className="text-[12px] text-gray-400 mb-4">{manageStudent.childFullName}</p>

            <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-4 flex justify-between text-[12px]">
              <div className="text-gray-500">Total owed<span className="ml-1.5 font-medium text-gray-800">{eur(totalOwed(manageStudent.id, fees))}</span></div>
              <div className="text-gray-500">Paid<span className="ml-1.5 font-medium text-emerald-700">{eur(totalPaid(manageStudent.id, payments))}</span></div>
              <div className="text-gray-500">Remaining
                <span className={`ml-1.5 font-medium ${totalOwed(manageStudent.id, fees) - totalPaid(manageStudent.id, payments) > 0 ? "text-red-600" : "text-emerald-700"}`}>
                  {eur(totalOwed(manageStudent.id, fees) - totalPaid(manageStudent.id, payments))}
                </span>
              </div>
            </div>

            <div className="flex rounded-lg bg-gray-100 p-0.5 mb-4">
              {(["fee", "payment"] as const).map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setError(""); }}
                  className={`flex-1 py-1.5 rounded-md text-[12px] font-medium transition-colors ${activeTab === tab ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {tab === "fee" ? "Add fee" : "Log payment"}
                </button>
              ))}
            </div>

            {activeTab === "fee" ? (
              <div>
                <label className={labelCls}>Amount (€)</label>
                <input type="number" value={feeAmount}
                  onChange={(e) => { setFeeAmount(e.target.value); setError(""); }}
                  placeholder="e.g. 500 or -30 to subtract" className={inputCls} autoFocus />
                <label className={`${labelCls} mt-3`}>Note (optional)</label>
                <input type="text" value={feeNote}
                  onChange={(e) => setFeeNote(e.target.value)}
                  placeholder="e.g. Course fee, Workbook, Extra class" className={inputCls} />
              </div>
            ) : (
              <div>
                <label className={labelCls}>Amount received (€)</label>
                <input type="number" min={1} value={payAmount}
                  onChange={(e) => { setPayAmount(e.target.value); setError(""); }}
                  placeholder="e.g. 200" className={inputCls} autoFocus />
                <label className={`${labelCls} mt-3`}>Note (optional)</label>
                <input type="text" value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. First instalment" className={inputCls} />
              </div>
            )}

            {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}

            <div className="flex gap-2 mt-4">
              <button onClick={closeManage}
                className="flex-1 px-3.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={activeTab === "fee" ? handleAddFee : handleLogPayment}
                className="flex-1 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-[12px] font-medium hover:bg-blue-700 transition-colors">
                {activeTab === "fee" ? "Add fee" : "Confirm payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History modal */}
      {historyStudent && (() => {
        const history = buildHistory(historyStudent);
        const owed = totalOwed(historyStudent.id, fees);
        const paid = totalPaid(historyStudent.id, payments);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setHistoryStudent(null)}>
            <div className="bg-white rounded-xl border border-gray-200 p-5 w-[500px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4">
                <p className="text-[14px] font-semibold text-gray-800">History</p>
                <p className="text-[12px] text-gray-400">{historyStudent.childFullName}</p>
              </div>

              {history.length === 0 ? (
                <p className="text-[13px] text-gray-400 italic">Nothing logged yet.</p>
              ) : (
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Date", "Type", "Amount", "Note"].map((h) => (
                          <th key={h} className="text-left text-[11px] text-gray-400 font-medium pb-2 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {history.map((row) => {
                        if (row.kind === "payment") {
                          const p = row.item as Payment;
                          return (
                            <tr key={`pay-${p.id}`}>
                              <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">{p.date}</td>
                              <td className="py-2 pr-4">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-medium">Payment</span>
                              </td>
                              <td className="py-2 pr-4 text-emerald-700 font-medium whitespace-nowrap">
                                {eur(p.amount)}<span className="text-gray-400 font-normal capitalize ml-1">· {p.method}</span>
                              </td>
                              <td className="py-2 pr-4 text-gray-400">{p.note ?? "—"}</td>
                            </tr>
                          );
                        } else {
                          const f = row.item as Fee;
                          return (
                            <tr key={`fee-${f.id}`}>
                              <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">{f.date}</td>
                              <td className="py-2 pr-4">
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-medium">Fee</span>
                              </td>
                              <td className={`py-2 pr-4 font-medium whitespace-nowrap ${f.amount < 0 ? "text-red-500" : "text-gray-800"}`}>
                                {eur(f.amount)}
                              </td>
                              <td className="py-2 pr-4 text-gray-400">{f.note ?? "—"}</td>
                            </tr>
                          );
                        }
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                <span className="text-[12px] text-gray-500">
                  Paid <span className="font-medium text-gray-800">{eur(paid)}</span>
                  <span className="text-gray-400"> / {eur(owed)}</span>
                  {owed > 0 && (
                    <span className={`ml-2 font-medium ${owed - paid > 0 ? "text-red-500" : "text-emerald-600"}`}>
                      ({owed - paid > 0 ? `${eur(owed - paid)} remaining` : "fully paid"})
                    </span>
                  )}
                </span>
                <button onClick={() => setHistoryStudent(null)}
                  className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-600 hover:bg-gray-50 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}