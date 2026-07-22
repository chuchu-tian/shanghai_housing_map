// js/data.js
import { DATA } from "./config.js";
import { cloudEnabled, cloudLoadHousing, cloudSaveHousing } from "./cloud.js";
export async function loadJSON(path){
  const r = await fetch(path);
  if(!r.ok) throw new Error(`加载失败 ${path}: ${r.status}`);
  return r.json();
}
export async function loadDistricts(){ return loadJSON(DATA.districts); }

async function loadHousing(){
  // 云端优先：房产数据存 Supabase，编辑后全设备可见；连不上退回站点自带文件
  if(cloudEnabled()){
    try{
      const doc = await cloudLoadHousing();
      if(doc) return doc;
      const file = await loadJSON(DATA.housing);
      try{ await cloudSaveHousing(file); }catch(_){}  // 首次灌入云端
      return file;
    }catch(e){ console.warn("云端房产数据不可用，退回本地文件：", e); }
  }
  return loadJSON(DATA.housing);
}

export async function loadAll(){
  const [districts, rings, blocks, housing] = await Promise.all([
    loadJSON(DATA.districts), loadJSON(DATA.rings), loadJSON(DATA.blocks), loadHousing(),
  ]);
  return { districts, rings, blocks, housing };
}
export function blockData(housing, name){ return housing.blocks[name] || null; }

