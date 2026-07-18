// js/favorites.js
import { loadJSON } from "./data.js";
import { DATA } from "./config.js";
import { cloudEnabled, cloudLoad, cloudSave } from "./cloud.js";
let state = null;

// 是否有本地服务端可写（localhost + server.py）；静态部署时走 localStorage
const HAS_SERVER = location.protocol !== "file:" &&
  (location.hostname === "localhost" || location.hostname === "127.0.0.1");
const LS_KEY = "shmap_profiles";

export async function loadProfiles(){
  // 1) 云端优先（配置了 Supabase）：全家跨设备实时同步
  if(cloudEnabled()){
    try{
      const doc = await cloudLoad();
      if(doc){ state = doc; return state; }
      // 云端为空 → 用默认档案初始化并写回云端
      state = await loadDefault();
      try{ await cloudSave(state); }catch(_){}
      return state;
    }catch(e){ console.warn("云端不可用，退回本地：", e); }
  }
  // 2) 静态站：localStorage
  if(!HAS_SERVER){
    const cached = localStorage.getItem(LS_KEY);
    if(cached){ try{ state = JSON.parse(cached); return state; }catch(_){} }
  }
  // 3) 服务端文件 / 站点自带默认
  state = await loadDefault();
  return state;
}

async function loadDefault(){
  try{ return await loadJSON(DATA.profiles); }
  catch(_){ return await loadJSON("data/profiles.default.json"); }
}
export function getState(){ return state; }
export function activeProfile(){ return state.profiles.find(p=>p.id===state.active); }
export function isFav(kind, name){
  const p = activeProfile();
  return (kind==="block"?p.blocks:p.communities).includes(name);
}
export function toggleFav(kind, name){
  const p = activeProfile();
  const arr = kind==="block" ? p.blocks : p.communities;
  const i = arr.indexOf(name);
  if(i>=0) arr.splice(i,1); else arr.push(name);
  return save();
}
export function switchProfile(id){ state.active = id; return save(); }
export function renameProfile(id, name){
  const p = state.profiles.find(x=>x.id===id);
  if(p) p.name = name;
  return save();
}
export function togglePublish(name){
  if(!state.published) state.published = [];
  const i = state.published.indexOf(name);
  if(i>=0) state.published.splice(i,1); else state.published.push(name);
  return save();
}
export function isPublished(name){ return (state.published||[]).includes(name); }
export function setPublished(names){ state.published = [...names]; return save(); }

async function save(){
  if(cloudEnabled()){
    try{ await cloudSave(state); return; }
    catch(e){ console.warn("云端保存失败，退回本地：", e); }
  }
  if(HAS_SERVER){
    await fetch("/api/profiles", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(state),
    });
  }else{
    localStorage.setItem(LS_KEY, JSON.stringify(state));  // 静态部署：存浏览器本地
  }
}

