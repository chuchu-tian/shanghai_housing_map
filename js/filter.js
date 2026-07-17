// js/filter.js
let current = "all";
export function getFilter(){ return current; }
// 板块是否含某类型小区
export function blockHasType(data, type){
  if(type==="all") return true;
  if(!data || !data.communities) return false;
  return data.communities.some(c => c.property_type===type);
}
export function initFilter(onChange){
  document.querySelectorAll("#filterbar button").forEach(btn=>{
    btn.onclick = () => {
      document.querySelectorAll("#filterbar button").forEach(b=>b.classList.remove("on"));
      btn.classList.add("on");
      current = btn.dataset.filter;
      onChange(current);
    };
  });
}
