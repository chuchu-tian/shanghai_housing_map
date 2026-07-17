// js/app.js
import { initMap, renderDistricts, renderRings, renderBlocks, applyBlockFilter } from "./map.js";
import { loadAll, blockData } from "./data.js";
import { renderPanel, filterPanelList } from "./panel.js";
import { initFilter, getFilter } from "./filter.js";
async function main(){
  initMap();
  try{
    const { districts, rings, blocks, housing } = await loadAll();
    renderDistricts(districts);
    renderRings(rings);
    renderBlocks(blocks, (name)=>{
      renderPanel(name, blockData(housing, name));
      filterPanelList(getFilter());   // 新开面板时套用当前筛选
    });
    initFilter((type)=>{ applyBlockFilter(housing, type); filterPanelList(type); });
    window.__housing = housing;
  }catch(e){ console.error(e); alert("数据加载失败，请用本地服务器打开"); }
}
main();
