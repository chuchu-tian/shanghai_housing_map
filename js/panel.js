// js/panel.js
const CUR_YEAR = 2026;
function ageText(c){
  if(!c.built_year) return "";
  // 新房：显示交付年份；二手：显示房龄
  if(c.property_type==="new") return `${c.built_year}交付`;
  const age = CUR_YEAR - c.built_year;
  return age > 0 ? `房龄${age}年` : `${c.built_year}交付`;
}
function priceText(c){
  if(c.property_type==="new") return c.list_price ? `${(c.list_price/10000).toFixed(1)}万` : "—";
  return c.avg_price ? `${(c.avg_price/10000).toFixed(1)}万` : "—";
}
function money(v){ return v ? `${(v/10000).toFixed(1)}万` : "—"; }

export function renderPanel(name, data){
  const panel = document.getElementById("panel");
  panel.classList.remove("empty");
  if(!data){ panel.innerHTML = `<div class="p-block"><span class="p-name">${name}</span></div><div class="p-sub">暂无数据</div>`; return; }
  const li = c => `<li data-type="${c.property_type}">
      <span>${c.name} <span class="badge ${c.property_type}">${c.property_type==="new"?"新房":"二手"}</span></span>
      <span class="rt">${priceText(c)}${ageText(c)?" · "+ageText(c):""}</span></li>`;
  panel.innerHTML = `
    <div class="p-block"><span class="p-name">${name}</span></div>
    <div class="p-sub">${(data.pros&&data.pros[0])||""}</div>
    <div class="price-row">
      <div class="price-box resale"><div class="lbl">二手成交均价</div><div class="val">${money(data.resale_avg_price)}</div></div>
      <div class="price-box new"><div class="lbl">新房均价</div><div class="val">${money(data.new_avg_price)}</div></div>
    </div>
    ${data.pros?`<div class="tags pros">优点：${data.pros.join(" · ")}</div>`:""}
    ${data.cons?`<div class="tags cons">缺点：${data.cons.join(" · ")}</div>`:""}
    <ul class="clist">${(data.communities||[]).map(li).join("")}</ul>`;
}

export function filterPanelList(type){
  document.querySelectorAll(".clist li").forEach(li=>{
    li.classList.toggle("hidden", type!=="all" && li.dataset.type!==type);
  });
}
