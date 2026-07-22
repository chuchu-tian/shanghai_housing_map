// js/cloud.js —— 云端收藏同步（Supabase REST）。整份 profiles 存为一行 JSONB。
import { SUPABASE, SUPABASE_ENABLED } from "./config.js";

const TABLE = "app_state";   // 表：id int PK, doc jsonb
const ROW_PROFILES = 1;      // 收藏档案文档
const ROW_HOUSING  = 2;      // 房产数据文档

function headers(){
  return {
    "apikey": SUPABASE.anonKey,
    "Authorization": `Bearer ${SUPABASE.anonKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
}

export function cloudEnabled(){ return SUPABASE_ENABLED(); }

async function loadRow(id){
  const url = `${SUPABASE.url}/rest/v1/${TABLE}?id=eq.${id}&select=doc`;
  const r = await fetch(url, { headers: headers() });
  if(!r.ok) throw new Error(`云端读取失败 ${r.status}`);
  const rows = await r.json();
  return rows.length ? rows[0].doc : null;
}
async function saveRow(id, doc){
  const url = `${SUPABASE.url}/rest/v1/${TABLE}?on_conflict=id`;
  const r = await fetch(url, {
    method: "POST",
    headers: { ...headers(), "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id, doc }),
  });
  if(!r.ok) throw new Error(`云端保存失败 ${r.status}`);
}

// 收藏档案
export async function cloudLoad(){ return loadRow(ROW_PROFILES); }
export async function cloudSave(doc){ return saveRow(ROW_PROFILES, doc); }
// 房产数据
export async function cloudLoadHousing(){ return loadRow(ROW_HOUSING); }
export async function cloudSaveHousing(doc){ return saveRow(ROW_HOUSING, doc); }
