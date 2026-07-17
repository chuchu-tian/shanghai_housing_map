// js/data.js
import { DATA } from "./config.js";
export async function loadJSON(path){
  const r = await fetch(path);
  if(!r.ok) throw new Error(`加载失败 ${path}: ${r.status}`);
  return r.json();
}
export async function loadDistricts(){ return loadJSON(DATA.districts); }
export async function loadAll(){
  const [districts, rings, blocks, housing] = await Promise.all([
    loadJSON(DATA.districts), loadJSON(DATA.rings), loadJSON(DATA.blocks), loadJSON(DATA.housing),
  ]);
  return { districts, rings, blocks, housing };
}
export function blockData(housing, name){ return housing.blocks[name] || null; }
