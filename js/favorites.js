// js/favorites.js
import { loadJSON } from "./data.js";
import { DATA } from "./config.js";
let state = null;
export async function loadProfiles(){ state = await loadJSON(DATA.profiles); return state; }
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
async function save(){
  await fetch("/api/profiles", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify(state),
  });
}
