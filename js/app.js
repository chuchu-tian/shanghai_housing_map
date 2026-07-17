// js/app.js
import { initMap, renderDistricts, renderRings, renderBlocks, applyBlockFilter, markFavBlocks } from "./map.js";
import { loadAll, blockData } from "./data.js";
import { renderPanel, filterPanelList, currentBlockName, clearPanel } from "./panel.js";
import { initFilter, getFilter } from "./filter.js";
import { loadProfiles, getState, activeProfile, switchProfile, renameProfile } from "./favorites.js";
import { initPublishManager } from "./publish.js";

let HOUSING = null;
let favOnly = false;

function rerenderPanel(){
  const name = currentBlockName();
  if(name){
    renderPanel(name, blockData(HOUSING, name), rerenderPanel);
    filterPanelList(getFilter());
  }
  markFavBlocks(activeProfile().blocks, favOnly);
}

function refreshProfileUI(){
  const s = getState();
  const sel = document.getElementById("profileSelect");
  sel.innerHTML = s.profiles.map(p=>`<option value="${p.id}" ${p.id===s.active?"selected":""}>${p.name}</option>`).join("");
}

async function main(){
  initMap();
  try{
    const { districts, rings, blocks, housing } = await loadAll();
    HOUSING = housing;
    await loadProfiles();
    renderDistricts(districts);
    renderRings(rings);
    renderBlocks(blocks, (name)=>{
      renderPanel(name, blockData(housing, name), rerenderPanel);
      filterPanelList(getFilter());
    }, ()=>{ clearPanel(); });
    initFilter((type)=>{ applyBlockFilter(housing, type); filterPanelList(type); });

    // 身份切换
    refreshProfileUI();
    document.getElementById("profileSelect").onchange = async(e)=>{
      await switchProfile(e.target.value); rerenderPanel();
    };
    // 改名
    document.getElementById("renameBtn").onclick = async()=>{
      const p = activeProfile();
      const name = prompt("给当前身份改名：", p.name);
      if(name && name.trim()){ await renameProfile(p.id, name.trim()); refreshProfileUI(); }
    };
    // 只看收藏
    document.querySelector("#favOnly input").onchange = (e)=>{
      favOnly = e.target.checked;
      markFavBlocks(activeProfile().blocks, favOnly);
    };

    markFavBlocks(activeProfile().blocks, favOnly);
    initPublishManager(blocks.features.map(f=>f.properties.name));
    window.__housing = housing;
  }catch(e){ console.error(e); alert("数据加载失败，请用本地服务器打开（server.py）"); }
}
main();
