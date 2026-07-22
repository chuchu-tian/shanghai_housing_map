// js/editor.js —— 网页内编辑房产数据（板块 + 小区），保存到云端（Supabase）。
import { cloudEnabled, cloudSaveHousing } from "./cloud.js";
import { loadJSON } from "./data.js";
import { DATA } from "./config.js";

let HOUSING = null;      // 引用当前 housing 对象
let onSaved = null;      // 保存后回调（重渲染面板/地图）

export function initEditor(housing, savedCallback){
  HOUSING = housing;
  onSaved = savedCallback;
  document.getElementById("editClose").onclick = close;
  document.getElementById("editModal").onclick = (e)=>{ if(e.target.id==="editModal") close(); };
  document.getElementById("editAddComm").onclick = addCommRow;
  document.getElementById("editSave").onclick = save;
}

function close(){ document.getElementById("editModal").classList.add("modal-hidden"); }

let editingBlock = null;
export function openEditor(blockName){
  editingBlock = blockName;
  const d = HOUSING.blocks[blockName] || { pros:[], cons:[], communities:[] };
  document.getElementById("editTitle").textContent = `编辑 · ${blockName}`;
  document.getElementById("f_resale").value = d.resale_avg_price ?? "";
  document.getElementById("f_new").value = d.new_avg_price ?? "";
  document.getElementById("f_pros").value = (d.pros||[]).join("，");
  document.getElementById("f_cons").value = (d.cons||[]).join("，");
  const list = document.getElementById("editCommList");
  list.innerHTML = "";
  (d.communities||[]).forEach(c=>list.appendChild(commRow(c)));
  document.getElementById("editModal").classList.remove("modal-hidden");
}

function commRow(c={}){
  const li = document.createElement("li");
  li.className = "edit-comm";
  li.innerHTML = `
    <input class="c-name" placeholder="小区名" value="${c.name??""}">
    <select class="c-type">
      <option value="resale" ${c.property_type!=="new"?"selected":""}>二手</option>
      <option value="new" ${c.property_type==="new"?"selected":""}>新房</option>
    </select>
    <input class="c-price" type="number" placeholder="单价(元/㎡)" value="${c.property_type==='new'?(c.list_price??''):(c.avg_price??'')}">
    <input class="c-year" type="number" placeholder="年份" value="${c.built_year??""}">
    <button class="c-del" title="删除">✕</button>`;
  li.querySelector(".c-del").onclick = ()=> li.remove();
  return li;
}
function addCommRow(){ document.getElementById("editCommList").appendChild(commRow()); }

function splitList(s){ return s.split(/[，,、\s]+/).map(x=>x.trim()).filter(Boolean); }
function numOrNull(v){ const n=parseFloat(v); return isNaN(n)?null:n; }

async function save(){
  const resale = numOrNull(document.getElementById("f_resale").value);
  const nw = numOrNull(document.getElementById("f_new").value);
  const pros = splitList(document.getElementById("f_pros").value);
  const cons = splitList(document.getElementById("f_cons").value);
  const communities = [...document.querySelectorAll("#editCommList .edit-comm")].map(li=>{
    const name = li.querySelector(".c-name").value.trim();
    if(!name) return null;
    const type = li.querySelector(".c-type").value;
    const price = numOrNull(li.querySelector(".c-price").value);
    const year = numOrNull(li.querySelector(".c-year").value);
    const c = { name, property_type: type, built_year: year || undefined };
    if(type==="new") c.list_price = price || undefined; else c.avg_price = price || undefined;
    return c;
  }).filter(Boolean);

  HOUSING.blocks[editingBlock] = {
    ...(HOUSING.blocks[editingBlock]||{}),
    resale_avg_price: resale, new_avg_price: nw, pros, cons, communities,
  };

  const btn = document.getElementById("editSave");
  btn.disabled = true; btn.textContent = "保存中…";
  try{
    if(cloudEnabled()){
      await cloudSaveHousing(HOUSING);
    }else{
      // 本地 server.py：POST 到写文件接口（若有）；否则提示
      await fetch("/api/housing", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(HOUSING) });
    }
    close();
    onSaved && onSaved(editingBlock);
  }catch(e){
    alert("保存失败：" + e.message);
  }finally{
    btn.disabled = false; btn.textContent = "保存";
  }
}
