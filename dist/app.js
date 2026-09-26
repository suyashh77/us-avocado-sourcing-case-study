const state = { data: null, geo: null, caseData: null, layer: 'production', selected: 'Mexico', shock: false, diversion: 20, premium: 30, story: 0 };
const $ = (s) => document.querySelector(s);
const fmt = (v, digits = 0) => Number(v).toLocaleString('en-US', { maximumFractionDigits: digits });
const compact = (v) => v >= 1e6 ? `${fmt(v / 1e6, 2)}m` : `${fmt(v / 1e3, 0)}k`;
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SV = 'http://www.w3.org/2000/svg';
const Y = 2024;

function totals() {
  const { production, trade, usImports } = state.data;
  const prod = new Map(production.filter(r => r.year === Y).map(r => [r.country, r]));
  const exports = new Map(), elsewhere = new Map(), imports = new Map(), importValues = new Map();
  trade.forEach(r => { exports.set(r.origin, (exports.get(r.origin) || 0) + r.tonnes); if (r.destination !== 'United States of America') elsewhere.set(r.origin, (elsewhere.get(r.origin) || 0) + r.tonnes); });
  usImports.filter(r => r.year === Y).forEach(r => { imports.set(r.country, (imports.get(r.country) || 0) + r.tonnes); importValues.set(r.country, (importValues.get(r.country) || 0) + r.valueUsd); });
  return { prod, exports, elsewhere, imports, importValues };
}
function countries() {
  const match = new Map();
  state.data.production.forEach(r => match.set(r.m49, r.country));
  state.data.trade.forEach(r => { match.set(r.originM49, r.origin); if (!match.has(r.destinationM49)) match.set(r.destinationM49, r.destination); });
  return match;
}
function project([lon, lat]) { return [(lon + 180) * 2.5, (90 - lat) * (430 / 180)]; }
function polygonPath(coords) { return coords.map(ring => ring.map((p, i) => `${i ? 'L' : 'M'}${project(p).map(n => n.toFixed(1)).join(',')}`).join('') + 'Z').join(''); }
function geoPath(geometry) { return geometry.type === 'Polygon' ? polygonPath(geometry.coordinates) : geometry.coordinates.map(polygonPath).join(''); }
function appendSvg(parent, tag, attrs) { const node = document.createElementNS(SV, tag); Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k, v)); parent.append(node); return node; }
function colorFor(v, max, layer) {
  if (!v) return '#ced5ca';
  const t = Math.max(.08, Math.min(1, Math.sqrt(v / max)));
  const mix = (a,b,t) => Math.round(a+(b-a)*t);
  const lo = layer === 'imports' ? [196,216,191] : [196,219,178], hi = layer === 'imports' ? [21,83,87] : [37,88,55];
  return `rgb(${lo.map((x,i) => mix(x,hi[i],t)).join(',')})`;
}
function mapLocation(m49) { const feature = state.geo.features.find(f => f.properties.ISO_N3 === m49); return feature ? project([feature.properties.LABEL_X, feature.properties.LABEL_Y]) : null; }
function drawMap() {
  const svg = $('#world-map'); svg.replaceChildren();
  const t = totals(), mapNames = countries();
  const productionByM49 = new Map([...t.prod.values()].map(r => [r.m49, r.tonnes]));
  const exportByM49 = new Map(); state.data.trade.forEach(r => exportByM49.set(r.originM49, (exportByM49.get(r.originM49) || 0) + r.tonnes));
  const importByM49 = new Map(); state.data.trade.forEach(r => { if (t.imports.has(r.origin)) importByM49.set(r.originM49, t.imports.get(r.origin)); });
  const chosen = state.layer === 'production' ? productionByM49 : state.layer === 'trade' ? exportByM49 : importByM49;
  const max = Math.max(...chosen.values(), 1);
  state.geo.features.forEach(feature => {
    if (feature.properties.NAME === 'Antarctica') return;
    const m49 = feature.properties.ISO_N3, val = chosen.get(m49) || 0;
    const node = appendSvg(svg, 'path', {d:geoPath(feature.geometry), class:`country${val ? '' : ' no-data'}${mapNames.get(m49) === state.selected ? ' selected' : ''}`, 'data-m49':m49, tabindex:'0', role:'button', 'aria-label':`${mapNames.get(m49) || feature.properties.NAME}: ${val ? fmt(val) + ' tonnes' : 'no data'}`});
    node.style.fill = colorFor(val,max,state.layer);
    node.addEventListener('click', () => selectCountry(mapNames.get(m49) || feature.properties.NAME));
    node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); node.click(); } });
    node.addEventListener('mousemove', e => tooltip(e, `${escapeHtml(mapNames.get(m49) || feature.properties.NAME)}<br><strong>${val ? compact(val) + ' tonnes' : 'No data'}</strong>`));
    node.addEventListener('mouseleave', hideTooltip);
  });
  if (state.layer !== 'production') {
    const flows = state.layer === 'imports'
      ? state.data.trade.filter(r => r.destinationM49 === '840' && t.imports.has(r.origin) && r.origin !== 'Mexico' || r.origin === 'Mexico' && r.destinationM49 === '840').slice(0, 9)
      : state.data.trade.filter(r => r.tonnes >= 50000 && r.originM49 !== r.destinationM49).slice(0, 24);
    flows.forEach(flow => {
      if (state.shock && flow.origin === 'Mexico' && flow.destinationM49 === '840') return;
      const a = mapLocation(flow.originM49), b = mapLocation(flow.destinationM49); if (!a || !b) return;
      const cx = (a[0]+b[0])/2, cy = Math.min(a[1],b[1]) - Math.max(14,Math.abs(a[0]-b[0])*.12);
      appendSvg(svg,'path',{d:`M${a[0]},${a[1]} Q${cx},${cy} ${b[0]},${b[1]}`,class:`flow${flow.destinationM49 === '840' ? ' highlight' : ''}${flow.origin === state.selected ? ' selected-flow' : ''}`, 'stroke-width':Math.max(1,Math.min(7,Math.sqrt(flow.tonnes/20000))).toFixed(1)});
    });
  }
  if (state.layer === 'imports') {
    const p = mapLocation('840'); if (p) appendSvg(svg,'circle',{cx:p[0],cy:p[1],r:6,class:'map-point'});
  }
  const notes = {production:'Country shading = 2024 avocado production. Select a country to inspect it.',trade:'Lines = selected large reported 2024 bilateral export relationships. These are not shipment routes.',imports:'Shading = 2024 U.S. import volume by origin. Lines are country relationships, not exact routes.'};
  $('#map-note').textContent = notes[state.layer];
  $('#map-legend').innerHTML = `<span>${state.layer === 'production' ? 'TONNES GROWN' : state.layer === 'trade' ? 'TONNES EXPORTED' : 'TONNES IMPORTED BY U.S.'}</span><div class="legend-gradient"></div><span>LOW &nbsp;→&nbsp; HIGH · NO DATA IN GRAY</span>`;
  document.querySelectorAll('.layer').forEach(b => { const on = b.dataset.layer === state.layer; b.classList.toggle('active',on); b.setAttribute('aria-pressed',on); });
}
function tooltip(e, html) { const el=$('#tooltip'); el.innerHTML=html; el.hidden=false; el.style.left=`${Math.min(window.innerWidth-230,e.clientX+14)}px`; el.style.top=`${Math.min(window.innerHeight-65,e.clientY+14)}px`; }
function hideTooltip() { $('#tooltip').hidden=true; }
function selectCountry(name) { state.selected=name; drawMap(); drawDetail(); if ([...$('#country-select').options].some(o=>o.value===name)) $('#country-select').value=name; }
function drawDetail() {
  const t=totals(), name=state.selected, p=t.prod.get(name), imported=t.imports.get(name)||0, elsewhere=t.elsewhere.get(name)||0;
  $('#detail-country').textContent=name;
  $('#detail-production').textContent=p?fmt(p.tonnes):'No figure';
  $('#detail-us').textContent=imported?fmt(imported):'No recorded flow';
  $('#detail-elsewhere').textContent=t.exports.has(name)?fmt(elsewhere):'No figure';
  const share=imported/(t.imports.get('World')||1)*100, worldShare=p?.tonnes/state.data.worldProduction[Y]*100;
  $('#detail-lede').textContent=p?`${fmt(worldShare,1)}% of 2024 world output.${imported?` ${fmt(share,1)}% of 2024 U.S. imports.`:''}`:'No 2024 production figure in this source.';
  const laneMonths=Array.from({length:12},(_,i)=>state.data.usImports.find(r=>r.country===name&&r.year===2025&&r.month===i+1)?.tonnes||0);
  const laneTotal=laneMonths.reduce((sum,v)=>sum+v,0),windows=Array.from({length:10},(_,i)=>({start:i,tonnes:laneMonths.slice(i,i+3).reduce((sum,v)=>sum+v,0)})).sort((a,b)=>b.tonnes-a.tonnes),best=windows[0];
  const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  $('#detail-window').textContent=laneTotal?`${monthNames[best.start]}–${monthNames[best.start+2]} · ${fmt(best.tonnes/laneTotal*100,0)}% of 2025 U.S. receipts`:'No 2025 U.S. imports recorded';
  const questions={Mexico:'Which contracted volumes and crossings remain available during an inspection pause?',Peru:'Which summer weeks, Hass sizes, and pack formats can be committed beyond current buyers?',Colombia:'Which weeks and grades can be delivered reliably at an agreed landed cost?',Chile:'Can the small observed U.S. lane scale in the required week and size?', 'Dominican Republic':'Can this origin supply the required Hass specification?'};
  $('#detail-question').textContent=questions[name]||(laneTotal?'Validate weekly uncommitted volume, U.S. eligibility, grade, transit, and competing buyers.':'Confirm U.S. market access and a qualified commercial lane before counting replacement volume.');
  const destinations=state.data.trade.filter(r=>r.origin===name).sort((a,b)=>b.tonnes-a.tonnes).slice(0,3);
  $('#detail-destinations').textContent=destinations.length?`Top reported export destinations: ${destinations.map(r=>`${r.destination} (${compact(r.tonnes)})`).join(' · ')}.`:'No 2024 bilateral export destinations in this source.';
  const history=state.data.production.filter(r=>r.country===name).sort((a,b)=>a.year-b.year), max=Math.max(1,...history.map(r=>r.tonnes));
  $('#detail-trend').innerHTML=history.length?history.map(r=>`<span title="${r.year}: ${fmt(r.tonnes)} tonnes" style="height:${Math.max(3,r.tonnes/max*100)}%"></span>`).join(''):'<small>No production history in this snapshot.</small>';
  $('#detail-trend').setAttribute('aria-label',`${name} avocado production, 2015 to 2024: ${history.length ? history.map(r=>`${r.year} ${fmt(r.tonnes)} tonnes`).join('; ') : 'no history in this source'}`);
}
function drawEvidence() {
  const t=totals(), world=t.imports.get('World'), mx=t.imports.get('Mexico');
  $('#share-inline').textContent=`${fmt(state.data.analysis.concentration.at(-1).mexicoShare,1)}%`;
  $('#opening-gap').textContent=fmt(state.data.analysis.ceilingGapTonnes);
  $('#mx-share').textContent=`${fmt(mx/world*100,1)}%`;
  $('#ratio').textContent=fmt(mx/(world-mx),1);
  const top=[...t.prod.values()].sort((a,b)=>b.tonnes-a.tonnes).slice(0,6), max=top[0].tonnes;
  $('#production-ranking').innerHTML=top.map((r,i)=>`<div class="rank-row"><span class="num">${String(i+1).padStart(2,'0')}</span><span class="name">${escapeHtml(r.country)}</span><span class="rank-track"><span class="rank-fill" style="display:block;width:${r.tonnes/max*100}%"></span></span><span class="rank-value">${compact(r.tonnes)}</span></div>`).join('');
  drawSeasonality(Number($('#season-year').value));
  const faoMx=state.data.trade.find(r=>r.origin==='Mexico'&&r.destinationM49==='840')?.tonnes||0;
  const delta=mx-faoMx;
  $('#reconciliation').textContent=`For Mexico → U.S. in 2024, FAOSTAT records ${fmt(faoMx)} tonnes reported as Mexican exports; USDA ERS records ${fmt(mx)} tonnes of U.S. imports from Mexico. The ${fmt(Math.abs(delta))}-tonne difference (${fmt(Math.abs(delta)/mx*100,1)}% of the U.S. import measure) is visible rather than reconciled away. Reporters, timing, and revisions can differ. FAOSTAT's U.S. import-side figure is close to ERS, but the Atlas uses ERS as its U.S. baseline.`;
  drawAnalyst();
}
function drawAnalyst() {
  const a=state.data.analysis, series=a.concentration;
  $('#availability-share').textContent=`${fmt(a.importShareAvailability2024,1)}%`;
  $('#latest-mexico-share').textContent=`${fmt(series.at(-1).mexicoShare,1)}%`;
  $('#concentration-trend').innerHTML=series.map(r=>`<div class="trend-col" title="${r.year}: ${fmt(r.mexicoShare,1)}% Mexico; HHI ${fmt(r.hhi)}"><span class="trend-value">${fmt(r.mexicoShare,0)}%</span><span class="trend-bar" style="height:${r.mexicoShare}%"></span><span class="trend-year">${String(r.year).slice(2)}</span></div>`).join('');
  const months=a.months2024, janApr=months.slice(0,4), summer=months.slice(5,7);
  const pct=rows=>rows.reduce((n,r)=>n+r.mexicoTonnes,0)/rows.reduce((n,r)=>n+r.worldTonnes,0)*100;
  $('#calendar-read').textContent=`Mexico supplied ${fmt(pct(janApr),1)}% of January–April imports, versus ${fmt(pct(summer),1)}% in June–July. Peru sent ${fmt(janApr.reduce((n,r)=>n+r.peruTonnes,0))} tonnes to the U.S. in January–April and ${fmt(summer.reduce((n,r)=>n+r.peruTonnes,0))} in June–July.`;
  $('#monthly-risk').innerHTML=months.map(r=>`<div class="risk-month" title="${['January','February','March','April','May','June','July','August','September','October','November','December'][r.month-1]}: ${fmt(r.mexicoShare,1)}% Mexico (${fmt(r.mexicoTonnes)} of ${fmt(r.worldTonnes)} tonnes)"><span>${fmt(r.mexicoShare,0)}%</span><div class="risk-track"><div style="height:${r.mexicoShare}%"></div></div><b>${['J','F','M','A','M','J','J','A','S','O','N','D'][r.month-1]}</b></div>`).join('');
}
function drawCaseStudy() {
  const series=state.caseData.retailAsp, max=Math.max(...series.map(r=>r.usdPerFruit));
  $('#asp-chart').innerHTML=series.map(r=>`<div class="asp-year" tabindex="0" title="${r.year}: $${fmt(r.usdPerFruit,2)} per fruit"><span>$${fmt(r.usdPerFruit,2)}</span><div><i style="height:${r.usdPerFruit/max*100}%"></i></div><b>${r.year}</b></div>`).join('');
  drawCaseFigures();
  updateShortScenario();
}
function drawCaseFigures() {
  const concentration=state.data.analysis.concentration;
  $('#case-concentration').innerHTML=concentration.map(r=>`<div class="figure-bar" tabindex="0" title="${r.year}: ${fmt(r.mexicoShare,1)}% of U.S. import tonnes from Mexico"><strong>${fmt(r.mexicoShare,0)}%</strong><i style="height:${r.mexicoShare}%"></i><small>${String(r.year).slice(2)}</small></div>`).join('');
  const annual=new Map();
  state.data.usImports.filter(r=>r.country==='World').forEach(r=>{const a=annual.get(r.year)||{tonnes:0,usd:0};a.tonnes+=r.tonnes;a.usd+=r.valueUsd;annual.set(r.year,a);});
  const values=[...annual].sort((a,b)=>a[0]-b[0]).map(([year,r])=>({year,price:r.usd/r.tonnes/1000}));
  const max=Math.max(...values.map(r=>r.price));
  $('#case-import-value').innerHTML=values.map(r=>`<div class="figure-bar" tabindex="0" title="${r.year}: $${fmt(r.price,2)} per kg customs import unit value"><strong>$${fmt(r.price,2)}</strong><i style="height:${r.price/max*100}%"></i><small>${String(r.year).slice(2)}</small></div>`).join('');
  drawCaseOriginMix(Number($('#figure-year').value));
  drawTradeFigures();
}
function drawTradeFigures() {
  const origins=['Peru','Colombia','Chile'];
  const partners=['United States','Netherlands','Spain','United Kingdom','Other buyers'];
  const partnerFor=name=>name==='United States of America'?'United States':name==='Netherlands (Kingdom of the)'?'Netherlands':name==='Spain'?'Spain':name==='United Kingdom of Great Britain and Northern Ireland'?'United Kingdom':'Other buyers';
  const byOrigin=new Map(origins.map(name=>[name,new Map(partners.map(p=>[p,0]))]));
  state.data.trade.filter(r=>byOrigin.has(r.origin)).forEach(r=>{const m=byOrigin.get(r.origin),partner=partnerFor(r.destination);m.set(partner,m.get(partner)+r.tonnes);});
  const sourceTotals=new Map(origins.map(name=>[name,[...byOrigin.get(name).values()].reduce((a,b)=>a+b,0)]));
  const buyerTotals=new Map(partners.map(p=>[p,origins.reduce((sum,o)=>sum+byOrigin.get(o).get(p),0)]));
  const total=[...sourceTotals.values()].reduce((a,b)=>a+b,0),scale=(320-4*11)/total;
  const sourceNodes=new Map(),buyerNodes=new Map();
  let sy=42+(320-(total*scale+2*11))/2,by=42;
  origins.forEach(name=>{const h=sourceTotals.get(name)*scale;sourceNodes.set(name,{y:sy,h,offset:0});sy+=h+11;});
  partners.forEach(name=>{const h=buyerTotals.get(name)*scale;buyerNodes.set(name,{y:by,h,offset:0});by+=h+11;});
  const colors={Peru:'#739e66',Colombia:'#397c65',Chile:'#bd8564'};
  const svg=$('#trade-sankey');svg.replaceChildren();
  for(const origin of origins){
    for(const partner of partners){
      const tonnes=byOrigin.get(origin).get(partner);if(!tonnes)continue;
      const s=sourceNodes.get(origin),b=buyerNodes.get(partner),h=tonnes*scale;
      const y1=s.y+s.offset+h/2,y2=b.y+b.offset+h/2;s.offset+=h;b.offset+=h;
      const path=appendSvg(svg,'path',{d:`M190 ${y1} C395 ${y1}, 485 ${y2}, 690 ${y2}`,class:'sankey-flow',stroke:colors[origin],'stroke-width':Math.max(.5,h),fill:'none',tabindex:'0',role:'button','data-origin':origin,'data-partner':partner,'aria-label':`${origin} to ${partner}: ${fmt(tonnes)} tonnes of reported 2024 exports`});
      appendSvg(path,'title',{}).textContent=`${origin} → ${partner}: ${fmt(tonnes)} tonnes of reported exports`;
      const show=()=>{$('#sankey-readout').textContent=`${origin} → ${partner}: ${fmt(tonnes)} t (${fmt(tonnes/sourceTotals.get(origin)*100,1)}% of ${origin}'s reported exports).`;};
      path.addEventListener('click',show);
      path.addEventListener('focus',show);
      path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show();}});
      path.addEventListener('mouseenter',()=>svg.classList.add('has-focus'));
      path.addEventListener('mouseleave',()=>svg.classList.remove('has-focus'));
    }
  }
  for(const origin of origins){const n=sourceNodes.get(origin);appendSvg(svg,'rect',{x:180,y:n.y,width:10,height:n.h,fill:colors[origin]});const label=appendSvg(svg,'text',{x:4,y:n.y+n.h/2-2,class:'sankey-label'});label.textContent=origin;const value=appendSvg(svg,'text',{x:4,y:n.y+n.h/2+17,class:'sankey-value'});value.textContent=`${compact(sourceTotals.get(origin))} t`;}
  for(const partner of partners){const n=buyerNodes.get(partner);appendSvg(svg,'rect',{x:690,y:n.y,width:10,height:n.h,fill:'#395e4d'});const label=appendSvg(svg,'text',{x:714,y:n.y+n.h/2-2,class:'sankey-label'});label.textContent=partner;const value=appendSvg(svg,'text',{x:714,y:n.y+n.h/2+17,class:'sankey-value'});value.textContent=`${compact(buyerTotals.get(partner))} t`;}
  const max=Math.max(...sourceTotals.values());
  $('#lane-pool').innerHTML=origins.map(origin=>{const us=byOrigin.get(origin).get('United States'),elsewhere=sourceTotals.get(origin)-us;return `<div class="pool-row" tabindex="0" title="${origin}: ${fmt(us)} tonnes reported to the U.S.; ${fmt(elsewhere)} tonnes to other buyers"><span>${origin}</span><div class="pool-track"><i class="pool-us" style="width:${us/max*100}%"></i><i class="pool-other" style="width:${elsewhere/max*100}%"></i></div><strong>${compact(us)} / ${compact(elsewhere)}</strong></div>`;}).join('');
}
function drawCaseOriginMix(year) {
  const rows=state.data.usImports;
  const months=Array.from({length:12},(_,i)=>{const get=c=>rows.find(r=>r.year===year&&r.month===i+1&&r.country===c)?.tonnes||0;const world=get('World'),mexico=get('Mexico'),peru=get('Peru');return {world,mexico,peru,other:Math.max(0,world-mexico-peru)};});
  const max=Math.max(...months.map(r=>r.world));
  const names=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  $('#case-origin-mix').innerHTML=months.map((r,i)=>`<div class="figure-stack" tabindex="0" title="${names[i]} ${year}: ${fmt(r.world)} t total; ${fmt(r.mexico)} t Mexico; ${fmt(r.peru)} t Peru; ${fmt(r.other)} t other"><strong>${i===1||i===6?`${fmt(r.mexico/r.world*100,0)}%`:''}</strong><div style="height:${r.world/max*100}%"><i class="mexico" style="height:${r.mexico/r.world*100}%"></i><i class="peru" style="height:${r.peru/r.world*100}%"></i><i class="other" style="height:${r.other/r.world*100}%"></i></div><small>${names[i]}</small></div>`).join('');
  $('#case-origin-mix').setAttribute('aria-label',`Monthly U.S. fresh avocado imports by origin in ${year}`);
}
function drawSensitivity({worldWeek,mexicoWeek,otherWeek,weeks,availability,flexPct,bufferDays}) {
  const flexValues=[0,10,20,30,40],bufferValues=[0,2,3,5,7];
  const cells=[`<span class="heat-corner">BUFFER ↓</span>`,...flexValues.map(v=>`<span class="heat-label">${v}%</span>`)];
  for(const days of bufferValues){
    cells.push(`<span class="heat-label">${days}d</span>`);
    for(const flex of flexValues){
      const lost=mexicoWeek*weeks*(1-availability/100),extra=otherWeek*weeks*flex/100,buffer=Math.min(lost,mexicoWeek*days/7),gap=Math.max(0,lost-extra-buffer),pct=gap/(worldWeek*weeks)*100;
      const shade=Math.min(1,pct/85),hue=120-shade*105;
      cells.push(`<button type="button" class="heat-cell${days===bufferDays&&flex===flexPct?' selected':''}" data-flex="${flex}" data-buffer="${days}" style="background:hsl(${hue} 46% ${83-shade*34}%)" aria-label="${flex}% extra non-Mexico flow and ${days} buffer days: ${fmt(pct,1)}% gap" title="${fmt(gap)} tonnes uncovered"><span>${fmt(pct,0)}%</span></button>`);
    }
  }
  $('#case-sensitivity').innerHTML=cells.join('');
}
function openAppendixForHash() { const id=window.location.hash.slice(1);if(!id)return;const target=document.getElementById(id);if(target&&$('#appendix').contains(target))$('#appendix').open=true; }
function updateShortScenario() {
  const month=Number($('#case-month').value), weeks=Number($('#case-weeks').value), availability=Number($('#case-mexico').value), flexPct=Number($('#case-flex').value), bufferDays=Number($('#case-buffer').value);
  const base=state.caseData.baseline[month], days=new Date(2025,month,0).getDate();
  const worldWeek=base.worldTonnes*7/days, mexicoWeek=base.mexicoTonnes*7/days, otherWeek=base.otherTonnes*7/days;
  const lost=mexicoWeek*weeks*(1-availability/100), flex=otherWeek*weeks*flexPct/100, buffer=Math.min(lost,mexicoWeek*bufferDays/7), gap=Math.max(0,lost-flex-buffer);
  $('#case-weeks-out').textContent=`${weeks} ${weeks===1?'week':'weeks'}`;
  $('#case-mexico-out').textContent=`${availability}%`;
  $('#case-flex-out').textContent=`${flexPct}%`;
  $('#case-buffer-out').textContent=`${bufferDays} ${bufferDays===1?'day':'days'}`;
  $('#case-gap').textContent=`${fmt(gap)} t`;
  $('#case-gap-pct').textContent=`${fmt(gap/(worldWeek*weeks)*100,1)}%`;
  $('#case-lost').textContent=`${fmt(lost)} t`;
  $('#case-flex-tonnes').textContent=`−${fmt(flex)} t`;
  $('#case-buffer-tonnes').textContent=`−${fmt(buffer)} t`;
  $('#case-residual').textContent=`${fmt(gap)} t`;
  $('#case-baseline-note').textContent=`${month===2?'February':'July'} 2025 USDA ERS baseline: ${fmt(base.worldTonnes)} t total; ${fmt(base.mexicoTonnes)} t Mexico. Converted from a ${days}-day month.`;
  drawSensitivity({worldWeek,mexicoWeek,otherWeek,weeks,availability,flexPct,bufferDays});
}
function applyShortPreset(id) {
  const p=state.caseData.presets.find(r=>r.id===id); if(!p)return;
  $('#case-month').value=p.month; $('#case-weeks').value=p.weeks; $('#case-mexico').value=p.mexicoAvailabilityPct; $('#case-flex').value=p.otherFlexPct; $('#case-buffer').value=p.bufferDays;
  document.querySelectorAll('.preset').forEach(b=>b.classList.toggle('active',b.dataset.preset===id));
  updateShortScenario();
}
function drawGlobalDesk() {
  const d=state.data, current=d.worldProduction[Y], first=d.worldProduction[2015];
  const producers=d.production.filter(r=>r.year===Y&&r.tonnes>0);
  const mexico=producers.find(r=>r.country==='Mexico')?.tonnes||0;
  $('#global-output').textContent=compact(current);
  $('#global-growth').textContent=`+${fmt((current/first-1)*100,0)}%`;
  $('#global-producers').textContent=fmt(producers.length);
  $('#global-mexico').textContent=`${fmt(mexico/current*100,1)}%`;
  const years=Object.entries(d.worldProduction).map(([year,tonnes])=>({year,tonnes}));
  const max=Math.max(...years.map(r=>r.tonnes));
  $('#world-trend').innerHTML=years.map(r=>`<div class="world-year" tabindex="0" title="${r.year}: ${fmt(r.tonnes)} tonnes"><strong>${fmt(r.tonnes/1e6,1)}m</strong><span style="height:${r.tonnes/max*100}%"></span><small>${r.year.slice(2)}</small></div>`).join('');
  const edges=[...d.trade].sort((a,b)=>b.tonnes-a.tonnes).slice(0,6), edgeMax=edges[0]?.tonnes||1;
  $('#global-lanes').innerHTML=edges.map((r,i)=>`<button class="global-list-row" type="button" data-origin="${escapeHtml(r.origin)}"><span class="global-list-rank">${String(i+1).padStart(2,'0')}</span><span class="global-list-label">${escapeHtml(r.origin.replace(' (Kingdom of the)',''))} <i aria-hidden="true">→</i> ${escapeHtml(r.destination.replace(' (Kingdom of the)',''))}<span class="global-list-track"><span style="width:${r.tonnes/edgeMax*100}%"></span></span></span><strong>${compact(r.tonnes)}</strong></button>`).join('');
  const buyers=new Map(); d.trade.forEach(r=>buyers.set(r.destination,(buyers.get(r.destination)||0)+r.tonnes));
  const topBuyers=[...buyers].sort((a,b)=>b[1]-a[1]).slice(0,6), buyerMax=topBuyers[0]?.[1]||1;
  $('#global-destinations').innerHTML=topBuyers.map(([name,tonnes],i)=>`<div class="global-list-row"><span class="global-list-rank">${String(i+1).padStart(2,'0')}</span><span class="global-list-label">${escapeHtml(name.replace(' (Kingdom of the)',''))}<span class="global-list-track"><span style="width:${tonnes/buyerMax*100}%"></span></span></span><strong>${compact(tonnes)}</strong></div>`).join('');
  $('#global-lanes').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{state.layer='trade';selectCountry(b.dataset.origin);$('#explore').scrollIntoView({behavior:'smooth'});}));
  const origins=[...new Set([...producers.map(r=>r.country),...d.trade.map(r=>r.origin),...d.trade.map(r=>r.destination)])].sort((a,b)=>a.localeCompare(b));
  $('#country-select').innerHTML=origins.map(name=>`<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
  $('#country-select').value=state.selected;
}
function drawBrief() {
  const a=state.data.analysis, latest=a.concentration.at(-1);
  $('#brief-us-2025').textContent=`${compact(latest.worldTonnes)} tonnes`;
  $('#brief-mx-2025').textContent=`${fmt(latest.mexicoShare,1)}%`;
  $('#brief-gap').textContent=`${compact(a.ceilingGapTonnes)} tonnes`;
  const winter=a.months2024.slice(0,4),winterShare=winter.reduce((sum,r)=>sum+r.mexicoTonnes,0)/winter.reduce((sum,r)=>sum+r.worldTonnes,0)*100;
  $('#command-winter').textContent=`${fmt(winterShare,1)}%`;
  $('#winter-share-note').textContent=`${fmt(winterShare,1)}%`;
  $('#lane-mexico').textContent=`${compact(latest.mexicoTonnes)} t`;
  const names=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for(const [country,id] of [['Peru','peru'],['Colombia','colombia']]){
    const lane=a.alternativeProfiles.find(r=>r.country===country);
    $('#lane-'+id).textContent=`${compact(lane.usImports2025Tonnes)} t`;
    $('#lane-'+id+'-window').textContent=`${names[lane.peakThreeMonths2025[0]-1]}–${names[lane.peakThreeMonths2025[1]-1]}`;
  }
}
function drawAlternatives() {
  const reads={
    Peru:'Largest observed alternative export pool; U.S. lane is heavily concentrated in summer. Confirm diversion economics with current export customers.',
    Colombia:'A growing U.S. lane with a broader shipping calendar. Current U.S. volumes remain small beside Mexico.',
    'Dominican Republic':'An established U.S. lane, but USDA identifies it as the main source of non-Hass imports. Check product fit before treating it as Hass replacement.',
    Chile:'Reported exports to other markets exceed its small U.S. lane. Qualify route, season and commercial availability before scaling.'
  };
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  $('#origin-profiles').innerHTML=state.data.analysis.alternativeProfiles.map((p,i)=>{
    const growth=(p.usImports2025Tonnes/p.usImports2024Tonnes-1)*100;
    const destination=p.leadingNonUsDestination2024.replace(' (Kingdom of the)','');
    return `<article class="origin-profile"><div class="origin-profile-head"><span>0${i+1} / SUPPLIER LANE</span><h3>${escapeHtml(p.country)}</h3><p>${escapeHtml(reads[p.country])}</p></div><div class="origin-measures"><div><span>2025 U.S. IMPORTS</span><strong>${compact(p.usImports2025Tonnes)}</strong><small>${growth>=0?'+':''}${fmt(growth,0)}% vs 2024</small></div><div><span>2024 EXPORTS ELSEWHERE</span><strong>${compact(p.exportsElsewhere2024Tonnes)}</strong><small>already traded</small></div><div><span>2025 PEAK U.S. WINDOW</span><strong>${months[p.peakThreeMonths2025[0]-1]}–${months[p.peakThreeMonths2025[1]-1]}</strong><small>${fmt(p.peakThreeMonthShare2025,1)}% of annual U.S. flow</small></div><div><span>TOP REPORTED NON-U.S. DESTINATION</span><strong>${escapeHtml(destination)}</strong><small>${compact(p.leadingNonUsDestinationTonnes2024)} in 2024</small></div></div></article>`;
  }).join('');
}
function drawRetail() {
  const {scannerBenchmark:s,weeklyAdvertised:w}=state.data.retail;
  $('#retail-scanner-price').textContent=`$${fmt(s.usdPerPound,2)} / lb`;
  $('#retail-ad-price').textContent=`$${fmt(w.advertisedUsdEach,2)} / each`;
  $('#retail-ad-date').textContent=`USDA AMS national conventional summary · ${new Date(`${w.reportDate}T12:00:00`).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})} · ${fmt(w.adCount)} ads`;
  const bars=[['Year ago',w.yearAgoUsdEach,w.yearAgoAdCount],['Last week',w.priorWeekUsdEach,w.priorWeekAdCount],['This week',w.advertisedUsdEach,w.adCount]];
  const max=Math.max(...bars.map(r=>r[1]));
  $('#retail-ad-comparison').innerHTML=bars.map(([label,price,ads],i)=>`<div class="retail-compare-row"><span>${label}</span><div class="retail-compare-track"><div class="${i===2?'current':''}" style="width:${price/max*100}%"></div></div><strong>$${fmt(price,2)}</strong><small>${fmt(ads)} ads</small></div>`).join('');
  $('#retail-ad-note').innerHTML=`Comparable advertised item only: conventional Hass, each. The weekly report samples major grocery chains; ads are not units sold or transaction-weighted checkout prices. <a href="#sources">[6]</a>`;
}
function drawSeasonality(year) {
  const byMonth=Array.from({length:12},(_,i)=>{const rows=state.data.usImports.filter(r=>r.year===year&&r.month===i+1),get=(c)=>rows.find(r=>r.country===c)?.tonnes||0;return {mx:get('Mexico'),pe:get('Peru'),other:Math.max(0,get('World')-get('Mexico')-get('Peru'))};});
  const maxMonth=Math.max(...byMonth.map(x=>x.mx+x.pe+x.other));
  $('#seasonality').innerHTML=byMonth.map((v,i)=>`<div class="month-col" title="${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}: ${fmt(v.mx+v.pe+v.other)} tonnes"><div class="month-stack" style="height:${(v.mx+v.pe+v.other)/maxMonth*100}%"><span class="month-segment" style="height:${v.mx/(v.mx+v.pe+v.other)*100}%;background:#46694e"></span><span class="month-segment" style="height:${v.pe/(v.mx+v.pe+v.other)*100}%;background:#94b45f"></span><span class="month-segment" style="height:${v.other/(v.mx+v.pe+v.other)*100}%;background:#c1cbb4"></span></div><span class="month-label">${['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span></div>`).join('');
}
function eligibleSuppliers(t) { return [...t.imports.entries()].filter(([c,v])=>c!=='World'&&c!=='Mexico'&&v>0&&t.elsewhere.has(c)).map(([country,us])=>({country,us,elsewhere:t.elsewhere.get(country),redirect:t.elsewhere.get(country)*state.diversion/100})).sort((a,b)=>b.redirect-a.redirect); }
function drawScenario() {
  const t=totals(), lost=t.imports.get('Mexico'), suppliers=eligibleSuppliers(t), redirected=state.shock?suppliers.reduce((a,b)=>a+b.redirect,0):0, gap=state.shock?Math.max(0,lost-redirected):0;
  const baseUnit=(t.importValues.get('World')||0)/(t.imports.get('World')||1)/1000;
  const low=Math.max(0,state.premium-10), high=Math.min(100,state.premium+10);
  const extraLow=redirected*1000*baseUnit*low/100, extraHigh=redirected*1000*baseUnit*high/100;
  $('#shock-toggle').classList.toggle('active',state.shock); $('#shock-toggle').setAttribute('aria-pressed',state.shock);
  $('#shock-toggle').innerHTML=state.shock?'Restore Mexico <span aria-hidden="true">↺</span>':'Set to 0% <span aria-hidden="true">✕</span>';
  $('#result-state').textContent=state.shock?'MEXICO → 0%':'BASELINE';
  $('#gap-value').textContent=state.shock?compact(gap):'0';
  $('#track-redirect').style.width=state.shock?`${Math.min(100,redirected/lost*100)}%`:'0%';
  $('#track-gap').style.width=state.shock?`${Math.max(0,Math.min(100,gap/lost*100))}%`:'0%';
  $('#redirect-label').textContent=`${compact(redirected)} redirected`;
  $('#lost-label').textContent=`${compact(state.shock?lost:0)} lost`;
  $('#ceiling-gap').textContent=compact(state.data.analysis.ceilingGapTonnes);
  $('#ceiling-copy').textContent=`Redirecting all ${compact(state.data.analysis.diversionCeilingTonnes)} tonnes of reported non-U.S. exports from five existing U.S. origins still leaves ${compact(state.data.analysis.ceilingGapTonnes)} tonnes uncovered. This is a conditional import-equivalent bound, not an actual shortage or available-capacity estimate.`;
  $('#replacement-list').innerHTML=suppliers.map(s=>`<div class="replacement-row"><span>${escapeHtml(s.country)} · ${compact(s.elsewhere)} exported elsewhere</span><strong>+${compact(state.shock?s.redirect:0)}</strong></div>`).join('');
  $('#cost-value').textContent=state.shock?`$${fmt(extraLow/1e6)}–${fmt(extraHigh/1e6)}m`:'$0';
  $('#cost-explainer').textContent=`For redirected volume only, at a ${low}–${high}% premium to the 2024 average customs import unit value ($${fmt(baseUnit,2)}/kg). Assumption, not a price forecast.`;
  $('#risk-text').textContent=state.shock?`At ${state.diversion}% diversion, ${fmt(gap/lost*100,0)}% of the missing Mexican volume remains uncovered. Existing customers, seasonality, market access and logistics are the next constraints.`:'The next bottleneck is not where avocados grow. It is how much existing export supply can be diverted, in season, through U.S.-accessible channels.';
  $('#diversion-output').textContent=`${state.diversion}%`; $('#premium-output').textContent=`${state.premium}%`;
}
const steps=[
  ['The world grows 11.2 million tonnes.','FAOSTAT records production across many countries. Mexico accounts for about a quarter of the 2024 global harvest.','production','Mexico',false],
  ['Trade narrows the field.','A harvest can be consumed at home or sold into existing export markets. The map shows large reported country-to-country trade relationships, not physical routes.','trade','Peru',false],
  ['The U.S. buys most from Mexico.','USDA ERS records 1.066 million tonnes from Mexico in 2024—about 88% of all U.S. fresh-avocado imports by weight.','imports','Mexico',false],
  ['Even the extreme ceiling leaves a gap.','Set diversion to 100%. Redirecting all reported exports to other markets from the five existing U.S. alternative origins still leaves about 316,000 tonnes of the Mexican volume uncovered.','imports','Mexico',true]
];
function storyStep(index) { state.story=Math.max(0,Math.min(steps.length-1,index)); const [title,copy,layer,country,shock]=steps[state.story]; $('#story-count').textContent=`0${state.story+1} / 04`;$('#story-headline').textContent=title;$('#story-text').textContent=copy;$('#story-prev').disabled=state.story===0;$('#story-next').disabled=state.story===3;state.layer=layer;state.selected=country;state.shock=shock;drawMap();drawDetail();drawScenario(); }
function bind() {
  document.querySelectorAll('.layer').forEach(b=>b.addEventListener('click',()=>{state.layer=b.dataset.layer;drawMap();}));
  document.querySelectorAll('.preset').forEach(b=>b.addEventListener('click',()=>applyShortPreset(b.dataset.preset)));
  $('#figure-year').addEventListener('change',e=>drawCaseOriginMix(Number(e.target.value)));
  $('#case-sensitivity').addEventListener('click',e=>{const cell=e.target.closest('.heat-cell');if(!cell)return;$('#case-flex').value=cell.dataset.flex;$('#case-buffer').value=cell.dataset.buffer;document.querySelectorAll('.preset').forEach(b=>b.classList.remove('active'));updateShortScenario();});
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{const target=document.querySelector(link.getAttribute('href'));if(target&&$('#appendix').contains(target))$('#appendix').open=true;}));
  window.addEventListener('hashchange',openAppendixForHash);
  ['#case-month','#case-weeks','#case-mexico','#case-flex','#case-buffer'].forEach(id=>$(id).addEventListener('input',()=>{document.querySelectorAll('.preset').forEach(b=>b.classList.remove('active'));updateShortScenario();}));
  $('#country-select').addEventListener('change',e=>selectCountry(e.target.value));
  $('#select-mexico').addEventListener('click',()=>selectCountry('Mexico'));
  $('#shock-toggle').addEventListener('click',()=>{state.shock=!state.shock;drawMap();drawScenario();});
  $('#diversion').addEventListener('input',e=>{state.diversion=Number(e.target.value);drawScenario();});
  $('#premium').addEventListener('input',e=>{state.premium=Number(e.target.value);drawScenario();});
  $('#season-year').addEventListener('change',e=>drawSeasonality(Number(e.target.value)));
  $('#reset-scenario').addEventListener('click',()=>{state.diversion=20;state.premium=30;$('#diversion').value=20;$('#premium').value=30;drawScenario();});
  $('#jump-shock')?.addEventListener('click',()=>{state.shock=true;state.layer='imports';drawMap();drawScenario();$('#shock').scrollIntoView({behavior:'smooth'});});
  $('#start-story').addEventListener('click',()=>$('#brief').scrollIntoView({behavior:'smooth'}));
  $('#story-prev').addEventListener('click',()=>storyStep(state.story-1));
  $('#story-next').addEventListener('click',()=>storyStep(state.story+1));
  $('#story-replay').addEventListener('click',()=>storyStep(0));
}
async function init() { try { const [data,geo,caseData]=await Promise.all([fetch('data.json').then(r=>{if(!r.ok)throw Error('data');return r.json()}),fetch('world.geojson').then(r=>{if(!r.ok)throw Error('map');return r.json()}),fetch('case_data.json').then(r=>{if(!r.ok)throw Error('case data');return r.json()})]);state.data=data;state.geo=geo;state.caseData=caseData;bind();drawCaseStudy();drawGlobalDesk();drawEvidence();drawBrief();drawAlternatives();drawRetail();drawMap();drawDetail();drawScenario();openAppendixForHash();$('#story-prev').disabled=true; } catch(err) { $('#explore').innerHTML='<p class="load-error">The source snapshot could not load. Refresh the page or check the project data build.</p>'; console.error(err); } }
init();
