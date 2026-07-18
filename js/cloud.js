// js/cloud.js —— 云端收藏同步（Supabase REST）。整份 profiles 存为一行 JSONB。
import { SUPABASE, SUPABASE_ENABLED } from "./config.js";

const TABLE = "app_state";   // 表：id int PK, doc jsonb
const ROW_ID = 1;            // 单文档模型，固定一行

function headers(){
  return {
    "apikey": SUPABASE.anonKey,
    "Authorization": `Bearer ${SUPABASE.anonKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
}

export function cloudEnabled(){ return SUPABASE_ENABLED(); }

// 读云端 profiles 文档；无则返回 null（首次由本地默认档案初始化并写回）
export async function cloudLoad(){
  const url = `${SUPABASE.url}/rest/v1/${TABLE}?id=eq.${ROW_ID}&select=doc`;
  const r = await fetch(url, { headers: headers() });
  if(!r.ok) throw new Error(`云端读取失败 ${r.status}`);
  const rows = await r.json();
  return rows.length ? rows[0].doc : null;
}

// upsert 整份文档
export async function cloudSave(doc){
  const url = `${SUPABASE.url}/rest/v1/${TABLE}?on_conflict=id`;
  const r = await fetch(url, {
    method: "POST",
    headers: { ...headers(), "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: ROW_ID, doc }),
  });
  if(!r.ok) throw new Error(`云端保存失败 ${r.status}`);
}
