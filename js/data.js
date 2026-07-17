// js/data.js
import { DATA } from "./config.js";
export async function loadJSON(path){
  const r = await fetch(path);
  if(!r.ok) throw new Error(`加载失败 ${path}: ${r.status}`);
  return r.json();
}
export async function loadDistricts(){ return loadJSON(DATA.districts); }
