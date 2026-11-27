new MutationObserver(()=>{for(const c of document.querySelectorAll('.stack td:not([data-l])')){let i=0,p=c;while(p=p.previousElementSibling)i+=p.colSpan;c.dataset.l=c.closest('table').rows[0].cells[i]?.textContent||''}}).observe(document,{childList:true,subtree:true});
{

const E8=1e8, INF=Infinity;
const won=n=>Math.round(n).toLocaleString('ko-KR')+'원';
const eok=n=>{n=Math.round(n/1e4);const e=Math.floor(n/1e4),m=n%1e4;return (e?e+'억':'')+(m?' '+m.toLocaleString('ko-KR')+'만':'')+(n?'원':'0원')};
const prog=(b,t)=>{let tax=0,lo=0;for(const[u,r]of t){if(b>lo)tax+=(Math.min(b,u)-lo)*r;lo=u}return tax};
const RT={
  c2:[[3*E8,.005],[6*E8,.007],[12*E8,.01],[25*E8,.013],[50*E8,.015],[94*E8,.02],[INF,.027]],
  c3:[[3*E8,.005],[6*E8,.007],[12*E8,.01],[25*E8,.02],[50*E8,.03],[94*E8,.04],[INF,.05]],
  n2:[[3*E8,.005],[6*E8,.007],[12*E8,.013],[25*E8,.015],[50*E8,.02],[94*E8,.027],[INF,.035]],
  n3:[[3*E8,.005],[6*E8,.007],[12*E8,.013],[25*E8,.02],[50*E8,.03],[94*E8,.04],[INF,.05]]
};
const YR={
  2026:{label:'2026 현행',kind:'확정 세법',thr1:12*E8,dLive:12*E8,dNon:12*E8,multi:()=>9*E8,fmv:()=>.6,rate:n=>n>=3?RT.c3:RT.c2,cred:'hold',cap:INF},
  2027:{label:'2027 개편안',kind:'정부안 · 국회 심의 전',thr1:14*E8,dLive:14*E8,dNon:9*E8,multi:(res,tot)=>Math.min(9*E8,Math.max(4*E8,4*E8+5*E8*res/tot)),fmv:()=>.7,rate:n=>n>=3?RT.n3:RT.n2,cred:'max',cap:8e6},
  2028:{label:'2028 개편안',kind:'정부안 · 국회 심의 전',thr1:14*E8,dLive:14*E8,dNon:9*E8,multi:(res,tot)=>Math.min(9*E8,Math.max(4*E8,4*E8+5*E8*res/tot)),fmv:h=>h?.8:.7,rate:()=>RT.n3,cred:'res',cap:6e6}
};
const PSTD=[[6e7,.001],[1.5e8,.0015],[3e8,.0025],[INF,.004]];
const PONE=[[6e7,.0005],[1.5e8,.001],[3e8,.002],[INF,.0035]];
const ageR=a=>a>=70?.4:a>=65?.3:a>=60?.2:0;
const yrR=y=>y>=15?.5:y>=10?.4:y>=5?.2:0;

function propTax(a,one,cap,rOv){
  const p=a.price, ratio=rOv!=null?rOv:one?(p<=3*E8?.43:p<=6*E8?.44:.45):.6, full=p*ratio;
  /* 재산세 과표상한제: 직전 연도 과세표준 + 올해 과세표준 × 5% 를 넘지 않음 (cap 있을 때만, 시뮬레이션용) */
  const base=cap==null?full:Math.min(full,cap+full*.05);
  const special=one&&p<=9*E8, main=prog(base,special?PONE:PSTD), std=prog(full,PSTD);
  const city=base*.0014, edu=main*.2;
  return {ratio,base,special,main,std,city,edu,total:main+city+edu};
}
function jong(hold,isOne,y,age,cnt,fOv){
  const Y=YR[y], tot=hold.reduce((s,h)=>s+h.a.price*h.s,0);
  const r={tot,ded:0,fmv:0,base:0,calc:0,pded:0,credRate:0,cred:0,tax:0,nong:0,total:0,isOne};
  if(!tot)return r;
  if(isOne){if(tot<=Y.thr1)return r;r.ded=hold[0].a.live?Y.dLive:Y.dNon}
  else{if(tot<=9*E8)return r;const res=hold.reduce((s,h)=>s+(h.a.live?h.a.price*h.s:0),0);r.ded=Y.multi(res,tot)}
  const heavy=!isOne&&(cnt>=3||hold.some(h=>h.a.adj));
  r.fmv=fOv!=null?fOv:Y.fmv(heavy); r.base=Math.max(0,tot-r.ded)*r.fmv;
  r.calc=prog(r.base,Y.rate(cnt));
  let pm=0,ps=0,wr=0;
  for(const h of hold){const t=h.pt;pm+=t.main*h.s;ps+=t.std*h.s;wr+=h.a.price*h.s*t.ratio}
  wr/=tot; r.pded=ps?pm*Math.min(1,r.base*wr*.004/ps):0;
  const sc=Math.max(0,r.calc-r.pded);
  if(isOne){const a=hold[0].a;let yr=0;
    if(Y.cred==='hold')yr=yrR(a.hold);else if(Y.cred==='max')yr=Math.max(yrR(a.hold)/2,yrR(a.res));else yr=yrR(a.res);
    r.credRate=Math.min(.8,ageR(age)+yr);r.cred=Math.min(sc*r.credRate,Y.cap)}
  r.tax=Math.max(0,sc-r.cred); r.nong=r.tax*.2; r.total=r.tax+r.nong; return r;
}
function shareOf(a,p){if(a.owner==='J'){const x=Math.min(100,Math.max(0,a.sa??50))/100;return p==='A'?x:1-x}return a.owner===p?1:0}
function compute(st,y,o={}){
  /* st.ov: 사용자가 바꾼 비율 (real 현실화율 %, propR 재산세 공정비율 %, jongR 종부세 공정비율 %) */
  const ov=st.ov||{},mul=(ov.real||69)/69,pR=ov.propR!=null?ov.propR/100:null,jR=ov.jongR!=null?ov.jongR/100:null;
  const apts=st.apts.filter(a=>a.price>0).map(a=>mul===1?a:{...a,price:a.price*mul}), one=apts.length===1;
  const pts=apts.map((a,i)=>propTax(a,one,o.cap?o.cap[i]:null,pR));
  const propOf=p=>apts.reduce((t,a,i)=>t+shareOf(a,p)*(pts[i].main+pts[i].city),0);
  const propSum=pts.reduce((s,t)=>s+t.total,0);
  const run=(special)=>{
    const out={};
    for(const p of ['A','B']){
      let hold=[];apts.forEach((a,i)=>{const s=shareOf(a,p);if(s)hold.push({a,s,pt:pts[i]})});
      let isOne=one&&hold.length&&hold[0].s===1;
      if(special&&one&&apts[0].owner==='J'){const m=shareOf(apts[0],'A')>=.5?'A':'B';hold=p===m?[{a:apts[0],s:1,pt:pts[0]}]:[];isOne=p===m}
      out[p]=jong(hold,isOne,y,p==='A'?st.ageA:st.ageB,hold.length,jR);
      /* 종부세 세부담상한: (재산세+종부세)가 직전 연도의 capRate배를 넘지 않음 (prev 있을 때만, 시뮬레이션용) */
      if(o.prev){const r=out[p],allow=Math.max(0,o.capRate*o.prev[p]-propOf(p));if(r.tax>allow){r.capped=true;r.tax=allow;r.nong=allow*.2;r.total=allow*1.2}}
    }
    out.sum=out.A.total+out.B.total;return out;
  };
  let J=run(false),alt=null,useSp=false;
  if(one&&apts[0].owner==='J'){const S=run(true);alt={each:J.sum,special:S.sum};if(S.sum<J.sum){J=S;useSp=true}}
  return {apts,pts,one,propSum,J,alt,useSp,total:propSum+J.sum,perP:{A:propOf('A')+J.A.tax,B:propOf('B')+J.B.tax}};
}
/* 공시가격이 해마다 rate씩 오를 때 n년 뒤 보유세. mode: 'cur' 현행 세법 유지 / 'new' 개편안 */
function simulate(st,rate,n,mode){
  let r=compute(st,2026),cap=r.pts.map(t=>t.base),prev=r.perP;
  for(let k=1;k<=n;k++){
    const s={...st,apts:st.apts.map(a=>({...a,price:a.price*Math.pow(1+rate,k)}))};
    const y=mode==='cur'?2026:Math.min(2026+k,2028);
    r=compute(s,y,{cap,prev,capRate:y===2026?1.5:2});cap=r.pts.map(t=>t.base);prev=r.perP;
  }
  return r;
}
window.__calc={compute,YR,simulate};


const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const segSet=(id,v)=>{for(const b of $(id).children)b.setAttribute('aria-pressed',b.dataset.v==String(v))};
const rowsHtml=rs=>rs.map(([l,v,c])=>`<div class="row${c?' '+c:''}"><span>${l}</span><b>${v}</b></div>`).join('');
const isAdj=r=>r!=='etc';
let MBF=null,MBT=null;
function mbar(){if(!MBF||!$('mbar'))return;const [l,v]=MBF();$('mbL').textContent=l;$('mbV').textContent=v}
if($('apts')){
/* ---------- UI ---------- */


const mk=(price,o={})=>Object.assign({name:'',price,mode:'pub',owner:'A',sa:50,region:'seoul',live:true,adj:true,hold:10,res:10},o);
const PRE={
  '1주택 실거주':{ageA:62,ageB:60,apts:[mk(15.6*E8,{name:'래미안 84㎡',hold:10,res:10})]},
  '1주택 비거주':{ageA:52,ageB:50,apts:[mk(18*E8,{name:'헬리오시티 84㎡',live:false,hold:5,res:0,adj:true})]},
  '부부 공동명의':{ageA:66,ageB:64,apts:[mk(22*E8,{name:'아크로리버 84㎡',owner:'J',hold:15,res:15,adj:true})]},
  '2주택':{ageA:55,ageB:53,apts:[mk(12*E8,{name:'거주 아파트'}),mk(6*E8,{name:'세 준 아파트',live:false,owner:'B',hold:5,res:0})]},
  '3주택':{ageA:58,ageB:56,apts:[mk(14*E8,{name:'거주 아파트',adj:true}),mk(7*E8,{name:'임대 A',live:false,hold:5,res:0}),mk(5*E8,{name:'임대 B',live:false,hold:0,res:0})]}
};
let st, year=2026;
try{st=JSON.parse(localStorage.getItem('aptTax1'))}catch(e){}
if(!st||!Array.isArray(st.apts))st={ageA:0,ageB:0,apts:[mk(15*E8,{hold:0,res:0})]};
try{year=+localStorage.getItem('aptTaxY')||2026}catch(e){}

$('years').innerHTML=Object.keys(YR).map(k=>`<button type="button" data-y="${k}">${k==2026?'올해 (2026)':k+' 개편안'}</button>`).join('');
const YRS=[[0,'5년 미만'],[5,'5~10년'],[10,'10~15년'],[15,'15년 이상']];
const opt=(arr,v)=>arr.map(([k,t])=>`<option value="${k}"${k==v?' selected':''}>${t}</option>`).join('');

const PREVIEW=location.protocol==='file:'||/claude|anthropic/.test(location.hostname);
const FALLBACK='지금은 바로 조회가 안 돼요. <a href="https://www.realtyprice.kr/" target="_blank" rel="noopener">부동산공시가격알리미 ↗</a>에서 동·호수를 고르면 나와요 (콜센터 1644-2828).';
async function lookup(){
  const ti=Math.min(st.lt||0,st.apts.length-1),a=st.apts[ti];const set=h=>{st.lmsg=h;$('lkRes').innerHTML=h};
  const q=(st.lq||'').trim(),dong=(st.ld||'').trim(),ho=(st.lh||'').trim();
  if(!q){set('<span class="lerr">아파트 주소나 단지명을 넣어 주세요.</span>');return}
  set('<span class="lwait">찾는 중…</span>');
  if(PREVIEW){set('<span class="lerr">이 미리보기 화면에는 조회 서버가 없어서 동작하지 않아요. 실제 사이트에 올리고 브이월드 인증키를 연결하면 바로 동작해요. 지금은 <a href="https://www.realtyprice.kr/" target="_blank" rel="noopener">부동산공시가격알리미 ↗</a>에서 확인해 주세요.</span>');return}
  let j;try{const r=await fetch('/api/gongsi?'+new URLSearchParams({q,dong,ho}));j=await r.json()}catch(x){j={error:'NET'}}
  if(j.error==='NO_KEY'){set('공시가격 바로 찾기는 준비 중이에요. '+FALLBACK.replace('지금은 바로 조회가 안 돼요. ','지금은 '));return}
  const apt=esc(j.aptName||''),yr=esc(j.year||'');
  const chips=(arr,attr,suf)=>'<div class="lchips">'+arr.slice(0,60).map(v=>`<button type="button" data-${attr}="${esc(v)}">${esc(v)}${suf}</button>`).join('')+(arr.length>60?'<span class="sub"> …</span>':'')+'</div>';
  if(j.match){const m=j.match;a.price=m.price;a.mode='pub';if(!a.name)a.name=`${j.aptName} ${m.dong}동`;
    st.lmsg=`<span class="lok">✓ ${apt} ${esc(m.dong)}동 ${esc(m.ho)}호${m.area?` (전용 ${esc(m.area)}㎡)`:''} · ${yr}년 공시가격 <b>${eok(m.price)}</b>을 ${st.apts.length>1?(ti+1)+'번째 아파트에 ':''}넣었어요.</span>`;
    drawApts();render();return}
  if(j.candidates){set('어떤 단지인가요?'+'<div class="lchips">'+j.candidates.map(c=>`<button type="button" data-cand="${esc(c.parcel)}">${esc(c.title)}<small>${esc(c.parcel)}</small></button>`).join('')+'</div>');return}
  if(j.dongs&&(j.error==='NO_DONG'||!dong)){set(`${apt} (${yr}년)${j.error?` — ${esc(dong)}동이 없어요.`:''} 동을 골라 주세요.`+chips(j.dongs,'pdong','동'));return}
  if(j.hos){set(`${apt} ${esc(j.dong||'')}동${j.error?` — ${esc(ho)}호가 없어요.`:''} 호를 골라 주세요.`+chips(j.hos,'pho','호'));return}
  if(j.error==='NOT_FOUND'){set('<span class="lerr">주소를 찾지 못했어요. 도로명(예: 반포대로 275)이나 지번(예: 반포동 1-1)으로 넣어 보세요.</span>');return}
  if(j.error==='NOT_APT'){set('<span class="lerr">이 주소에는 공동주택 공시가격이 없어요. 아파트 단지의 대표 지번이 맞는지 확인해 주세요.</span>');return}
  set('<span class="lerr">'+FALLBACK+'</span>');
}
function drawLook(){
  if(!$('lookbox'))return;
  const open=!!st.lopen;$('lkBody').hidden=!open;$('lkToggle').setAttribute('aria-expanded',open);$('lkArrow').textContent=open?'닫기 ▴':'열기 ▾';
  for(const [id,k] of [['lkQ','lq'],['lkD','ld'],['lkH','lh']])if(document.activeElement!==$(id))$(id).value=st[k]||'';
  const n=st.apts.length,ti=Math.min(st.lt||0,n-1);
  $('lkT').innerHTML=n>1?'<span>어느 집에 넣을까요?</span>'+st.apts.map((a,i)=>`<button type="button" data-lt="${i}" aria-pressed="${i===ti}">${i+1}번째${a.name?' · '+esc(a.name):''}</button>`).join(''):'';
  $('lkRes').innerHTML=st.lmsg||'';
}
function drawApts(){
  const multi=st.apts.length>1;
  $('apts').innerHTML=st.apts.map((a,i)=>{
    const shown=a.mode==='mkt'?a.price/.69:a.price;
    return `<div class="apt" data-i="${i}">
    <div class="hd"><b>${multi?(i+1)+'번째 아파트':'우리 아파트'}</b><input class="nmi" data-k="name" value="${esc(a.name)}" placeholder="이름 붙이기 (선택)" aria-label="${multi?(i+1)+'번째 아파트':'우리 아파트'} 이름">${st.apts.length>1?`<button class="x" type="button" data-del="${i}">삭제</button>`:''}</div>
    <div class="q">① 가격이 얼마예요?</div>
    <div class="seg sm">${[['pub','공시가격'],['mkt','시세(매매가)']].map(([k,t])=>`<button type="button" data-mode="${k}" aria-pressed="${a.mode===k}">${t}</button>`).join('')}</div>
    <div class="pricebox"><input data-k="price" type="number" inputmode="decimal" step="0.1" min="0" value="${+(shown/E8).toFixed(2)}" aria-label="가격 (억원)"><span>억원</span></div>
    <div class="hint">${a.mode==='mkt'?'공시가격 약 '+eok(a.price)+'로 계산 (시세의 69%)':eok(a.price)}</div>
    <div class="q">② 지금 이 집에 살고 있나요?</div>
    <div class="seg yn">${[[1,'네, 살아요'],[0,'아니요']].map(([k,t])=>`<button type="button" data-live="${k}" aria-pressed="${a.live==!!k}">${t}</button>`).join('')}</div>
    <div class="q">③ 누구 명의예요?</div>
    <div class="seg yn">${[['A','본인'],['B','배우자'],['J','부부 공동']].map(([k,t])=>`<button type="button" data-own="${k}" aria-pressed="${a.owner===k}">${t}</button>`).join('')}</div>
    ${a.owner==='J'?`<div class="share"><label>본인 지분<span class="pct"><input data-k="sa" type="number" inputmode="numeric" min="1" max="99" value="${a.sa??50}">%</span></label><span class="sub">배우자 ${100-(a.sa??50)}%</span><div class="seg sm">${[50,60,70,80].map(v=>`<button type="button" data-sa="${v}" aria-pressed="${(a.sa??50)==v}">${v}:${100-v}</button>`).join('')}</div></div>`:''}
    ${multi?`<div class="q">④ 어디에 있나요?</div>
    <div class="seg yn">${[['seoul','서울'],['gg','경기 규제'],['etc','그 외']].map(([k,t])=>`<button type="button" data-reg="${k}" aria-pressed="${(a.region||(a.adj?'seoul':'etc'))===k}">${t}</button>`).join('')}</div>
    <div class="hint">경기 규제지역 15곳: 과천·광명·하남·의왕·구리, 성남 분당·수정·중원, 수원 영통·장안·팔달, 안양 동안, 용인 수지·기흥, 화성 동탄구</div>`
    :`<details class="more"><summary>더 정확하게 (보유·거주 기간 → 세액공제)</summary>
    <div class="grid" style="padding-bottom:12px">
      <label>가진 지 얼마나?<select data-k="hold">${opt(YRS,a.hold)}</select></label>
      <label>산 지 얼마나?<select data-k="res">${opt(YRS,a.res)}</select></label>
    </div></details>`}</div>`}).join('');
  drawLook();
  const n=st.apts.length;for(const b of $('count').children)b.setAttribute('aria-pressed',n>=4?b.dataset.n==='4':+b.dataset.n===n);
}
$('apts').addEventListener('input',e=>{
  if(e.target.dataset.lk){st[e.target.dataset.lk]=e.target.value;try{localStorage.setItem('aptTax1',JSON.stringify(st))}catch(x){}return}
  const el=e.target,k=el.dataset.k,box=el.closest('.apt');if(!k||!box)return;
  const a=st.apts[+box.dataset.i];
  if(k==='price'){const v=parseFloat(el.value)||0;a.price=v*E8*(a.mode==='mkt'?.69:1);box.querySelector('.hint').textContent=a.mode==='mkt'?'공시가격 약 '+eok(a.price)+'로 계산 (시세의 69%)':eok(a.price)}
  else if(k==='name')a.name=el.value;
  else if(k==='live'||k==='adj')a[k]=el.checked;
  else if(k==='hold'||k==='res')a[k]=+el.value;
  else if(k==='owner'){a.owner=el.value;drawApts()}
  else if(k==='sa'){a.sa=Math.min(99,Math.max(1,parseInt(el.value)||50));const sb=box.querySelector('.share .sub');if(sb)sb.textContent='배우자 '+(100-a.sa)+'%';for(const b of box.querySelectorAll('[data-sa]'))b.setAttribute('aria-pressed',+b.dataset.sa===a.sa)}
  render();
});
$('lookbox').addEventListener('input',e=>{const k=e.target.dataset.lk;if(k){st[k]=e.target.value;try{localStorage.setItem('aptTax1',JSON.stringify(st))}catch(x){}}});
$('lookbox').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.lk){e.preventDefault();lookup()}});
$('lookbox').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.id==='lkToggle'){st.lopen=!st.lopen;drawLook();if(st.lopen)$('lkQ').focus();return}
  if(b.hasAttribute('data-go')){lookup();return}
  if(b.dataset.lt!=null){st.lt=+b.dataset.lt;drawLook();return}
  if(b.dataset.cand!=null){st.lq=b.dataset.cand;drawLook();lookup();return}
  if(b.dataset.pdong!=null){st.ld=b.dataset.pdong;drawLook();lookup();return}
  if(b.dataset.pho!=null){st.lh=b.dataset.pho;drawLook();lookup();return}});
$('apts').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const box=b.closest('.apt');
  if(b.dataset.mode&&box){const a=st.apts[+box.dataset.i];const shown=parseFloat(box.querySelector('[data-k=price]').value)||0;a.mode=b.dataset.mode;a.price=shown*E8*(a.mode==='mkt'?.69:1);drawApts();render();return}
  if(b.dataset.live&&box){const a=st.apts[+box.dataset.i];a.live=b.dataset.live==='1';if(a.live)st.apts.forEach(o=>{if(o!==a)o.live=false});drawApts();render();return}
  if(b.dataset.sa&&box){st.apts[+box.dataset.i].sa=+b.dataset.sa;drawApts();render();return}
  if(b.dataset.reg&&box){const a=st.apts[+box.dataset.i];a.region=b.dataset.reg;a.adj=a.region!=='etc';drawApts();render();return}
  if(b.dataset.own&&box){st.apts[+box.dataset.i].owner=b.dataset.own;drawApts();render();return}
  const d=b.dataset.del;if(d!==undefined){st.apts.splice(+d,1);drawApts();render()}});
$('count').onclick=e=>{const n=+e.target.dataset.n;if(!n)return;
  if(n<st.apts.length&&!(n===4&&st.apts.length>4))st.apts=st.apts.slice(0,n);
  while(st.apts.length<n)st.apts.push(mk(5*E8,{live:false,hold:0,res:0}));
  drawApts();render()};
$('addApt').onclick=()=>{st.apts.push(mk(5*E8,{live:false,hold:0,res:0}));drawApts();render()};
$('years').onclick=e=>{const y=e.target.dataset.y;if(!y)return;year=+y;try{localStorage.setItem('aptTaxY',y)}catch(x){}render()};
$('simArea').onclick=e=>{const v=e.target.closest('button')?.dataset.v;if(v){st.simArea=v;render()}};
$('simN').onclick=e=>{const v=e.target.closest('button')?.dataset.v;if(v){st.simN=+v;render()}};
$('simTbl').addEventListener('change',e=>{if(e.target.id==='simCustom'){const v=parseFloat(e.target.value);if(!isNaN(v)&&v>-50&&v<100){st.simCustom=v;render()}}});
for(const k of ['real','propR','jongR']){
  const setv=(v,src)=>{if(isNaN(v))return;st.ov=st.ov||{};st.ov[k]=v;render()};
  $('ov-'+k).addEventListener('input',e=>setv(+e.target.value));
  $('ov-'+k+'N').addEventListener('input',e=>{const v=parseFloat(e.target.value);if(v>=20&&v<=100)setv(v)});
}
$('ovReset').onclick=()=>{st.ov={};render()};
for(const id of['ageA','ageB'])$(id).addEventListener('input',e=>{st[id]=parseInt(e.target.value)||0;render()});
function syncAges(){$('ageA').value=st.ageA||'';$('ageB').value=st.ageB||''}

const SIMR={seoul:{name:'서울',now:18.60,max:28.42},all:{name:'전국',now:9.13,max:22.7}};
function renderSim(){
  if(!$('simTbl'))return;
  const ar=st.simArea||'seoul',n=st.simN||1,R=SIMR[ar],cu=st.simCustom??5;
  for(const b of $('simArea').children)b.setAttribute('aria-pressed',b.dataset.v===ar);
  for(const b of $('simN').children)b.setAttribute('aria-pressed',+b.dataset.v===n);
  const apts=st.apts.filter(a=>a.price>0);
  if(!apts.length){$('simTbl').innerHTML='<tbody><tr><td>아파트 가격을 넣어 주세요</td></tr></tbody>';return}
  const now=compute(st,2026).total,tot=apts.reduce((t,a)=>t+a.price,0);
  const rows=[['그대로',0,'공시가격이 안 오를 때'],['중간',R.max/2,'역대 최대 상승률의 절반'],['올해만큼',R.now,`2026년 ${R.name} 상승률`],['역대 최대',R.max,`2007년 ${R.name} 상승률`],['직접 입력',cu/100,'']].map(([l,r,d],k)=>[l,k===4?cu/100:r/100,d,k===4]);
  const dif=v=>{const d=v-now;return Math.abs(d)<1?'':`<small class="${d>0?'up':'down'}">${d>0?'+':'−'}${won(Math.abs(d))}</small>`};
  const yr=2026+n;
  $('simTbl').innerHTML=`<thead><tr><th>시나리오</th><th>연 상승률</th><th>${yr}년 공시가격${apts.length>1?' 합계':''}</th><th>현행 세법 그대로</th><th>개편안 통과 시</th></tr></thead><tbody>`+
    rows.map(([l,r,d,isC])=>{const a=simulate(st,r,n,'cur').total,b=simulate(st,r,n,'new').total;
      return `<tr class="${isC?'sel':''}"><td><b>${l}</b>${d?`<br><small class="sub">${d}</small>`:''}</td><td>${isC?`<span class="pct"><input id="simCustom" type="number" inputmode="decimal" step="0.5" min="-30" max="50" value="${cu}" aria-label="직접 입력 상승률">%</span>`:(r*100).toFixed(2).replace(/\.?0+$/,'')+'%'}</td><td>${eok(tot*Math.pow(1+r,n))}</td><td><b>${won(a)}</b><br>${dif(a)}</td><td><b>${won(b)}</b><br>${dif(b)}</td></tr>`}).join('')+'</tbody>';
  $('simNote').textContent=`올해(2026년) 보유세 ${won(now)} 기준이에요. 공시가격 변동률은 국토교통부 공동주택 공시가격 발표치(2026년 ${R.name} ${R.now}%, 역대 최대 2007년 ${R.max}%)를 썼어요. 재산세 과표상한제(해마다 과세표준 5%까지)와 종부세 세부담상한(직전 해의 150%, 개편안 200%)을 올해 계산값 기준으로 반영했어요. 세율·공제는 지금 기준이고, 나이·보유기간 공제는 그대로 둔 값이에요.`;
}
function ovAuto(r){
  const heavy=!r.one&&(r.apts.length>=3||r.apts.some(a=>a.adj));
  const prop=r.one?(r.apts[0].price<=3*E8?43:r.apts[0].price<=6*E8?44:45):60;
  return {real:69,propR:prop,jongR:Math.round(YR[year].fmv(heavy)*100)};
}
function renderOv(r){
  if(!$('ovbox'))return;
  const ov=st.ov||{},au=ovAuto(r);let changed=false;
  for(const k of ['real','propR','jongR']){
    const v=ov[k]!=null?ov[k]:au[k];if(ov[k]!=null&&ov[k]!==au[k])changed=true;
    const rg=$('ov-'+k),nb=$('ov-'+k+'N');rg.value=Math.min(+rg.max,Math.max(+rg.min,v));if(document.activeElement!==nb)nb.value=v;
    rg.style.setProperty('--p',((rg.value-rg.min)/(rg.max-rg.min)*100)+'%');
    rg.closest('.ovrow').classList.toggle('chg',ov[k]!=null&&ov[k]!==au[k]);
  }
  const base=r.apts.reduce((t,a)=>t+a.price,0)/((ov.real||69)/69);
  $('ov-realH').innerHTML=ov.real&&ov.real!==69?`입력한 공시가격을 ${ov.real}% ÷ 69%로 바꿔 계산해요 → 적용 공시가격${r.apts.length>1?' 합계':''} <b>${eok(base*ov.real/69)}</b>`:'<b>현재 기준</b> 2026년 공동주택 현실화율 69% (2025년과 같음)';
  $('ov-propRH').innerHTML=`<b>현재 기준</b> ${au.propR}% · 1주택은 공시가격 3억 이하 43%, 6억 이하 44%, 6억 초과 45%, 다주택은 60%`;
  $('ov-jongRH').innerHTML=`<b>현재 기준</b> (${YR[year].label}) ${au.jongR}% · 현행 60%, 개편안 2027년 70%, 2028년 다주택·조정지역 80%`;
  $('ovReset').hidden=!changed&&!(ov.real&&ov.real!==69);
  $('ovbox').classList.toggle('chg',changed);
  const on=changed||(ov.real&&ov.real!==69);$('pkind').textContent=YR[year].kind+(on?' · 바꾼 비율 적용 중':'');
}
function render(){
  try{localStorage.setItem('aptTax1',JSON.stringify(st))}catch(e){}
  for(const b of $('years').children)b.setAttribute('aria-pressed',+b.dataset.y===year);
  const R={};for(const y of Object.keys(YR))R[y]=compute(st,+y);
  const r=R[year], base=R[2026];
  $('pyear').textContent=YR[year].label+' 보유세 고지 (추정)';
  $('pkind').textContent=YR[year].kind;
  $('total').textContent=won(r.total);
  $('monthly').textContent=r.total?`한 달에 ${won(r.total/12)}꼴 · 아파트 ${r.apts.length}채`:'아파트 가격을 넣어 주세요';
  const d=$('delta');
  if(year!==2026&&base.total){const df=r.total-base.total;d.hidden=false;d.className='delta '+(df>0?'up':df<0?'down':'');d.textContent=df?`현행보다 ${won(Math.abs(df))} ${df>0?'증가':'감소'}`:'현행과 같음'}else d.hidden=true;
  $('propT').textContent=won(r.propSum);$('jongT').textContent=won(r.J.sum);
  const half=r.propSum<=2e5, inst=r.J.A.tax>2.5e6||r.J.B.tax>2.5e6;
  $('stubs').innerHTML=[
    ['7월','재산세',half?r.propSum:r.propSum/2,half?'20만원 이하 → 한 번에':'1기분 (절반)'],
    ['9월','재산세',half?0:r.propSum/2,half?'7월에 냄':'2기분 (절반)'],
    ['12월','종부세',r.J.sum,r.J.sum?(inst?'1~15일 · 250만원 넘으면 분납 가능':'1~15일 납부'):'과세 대상 아님']
  ].map(([m,t,v,s])=>`<div class="stub"><span class="m">${m}</span> ${t}<b>${won(v)}</b><small>${s}</small></div>`).join('');
  const notes=[];
  if(r.one){const a=r.apts[0];notes.push(`<b>1세대 1주택</b>으로 계산했어요. 재산세 공정시장가액비율 ${Math.round(r.pts[0].ratio*100)}%${r.pts[0].special?', 1주택 특례세율':''} 적용.`);
    if(year>2026&&!a.live&&a.price>14*E8)notes.push('<b>비거주 1주택</b>은 개편안에서 공제가 9억원으로 줄어 세금이 늘어요.');}
  else if(r.apts.length){
    notes.push(`<b>${r.apts.length}주택 세대</b>로 계산했어요. 다주택은 재산세 1주택 감면이 없고, 종부세는 <b>사람(명의)별로</b> 따로 합산해요.`);
    for(const [p,nm] of [['A','본인'],['B','배우자']]){const j=r.J[p];if(!j.tot)continue;
      const cnt=r.apts.filter(a=>shareOf(a,p)>0).length;
      notes.push(`<b>${nm} 명의 ${cnt}채</b>${r.apts.some(a=>a.owner==='J')?' (공동명의는 지분만큼)':''} · 공시 합계 ${eok(j.tot)} → ${j.total?`공제 ${eok(j.ded)} 뒤 과세표준 ${eok(j.base)}, 종부세 ${won(j.total)}`:'9억원 이하라 종부세 없음'}`)}
    const c3=['A','B'].some(p=>r.apts.filter(a=>shareOf(a,p)>0).length>=3);
    if(c3&&year<2028)notes.push(`<b>3주택 이상</b>은 과세표준 12억원 초과분에 중과세율(최고 5%)이 붙어요.`);
    if(year===2028&&r.J.sum&&(c3||r.apts.some(a=>a.adj)))notes.push(`<b>2028 개편안</b>: 3주택 이상이거나 조정대상지역 집이 있으면 공정시장가액비율 80% 적용.`);
    if(year>2026&&r.J.sum)notes.push(`<b>개편안 다주택 공제</b>는 4억원 + 5억원 × (사는 집 가격 ÷ 전체 가격). 사는 집이 없으면 4억원만 공제돼요.`);
  }
  if(r.alt){notes.push(`<b>부부 공동명의 (${r.apts[0].sa??50}:${100-(r.apts[0].sa??50)})</b>: 각자 공제 ${won(r.alt.each)} vs 1주택 특례 ${won(r.alt.special)} → <b>${r.useSp?'특례 신청':'각자 공제'}</b>가 유리해요.`)}
  $('notes').innerHTML=notes.map(n=>`<p class="note">${n}</p>`).join('');
  renderOv(r);

  const ys=Object.keys(YR);
  $('cmp').innerHTML=`<thead><tr><th>연도</th><th>재산세</th><th>종부세</th><th>합계 보유세</th><th>현행 대비</th></tr></thead><tbody>`+
    ys.map(y=>{const x=R[y],df=x.total-base.total;return `<tr class="${+y===year?'sel':''}"><td>${YR[y].label}</td><td>${won(x.propSum)}</td><td>${won(x.J.sum)}</td><td><b>${won(x.total)}</b></td><td class="${df>0?'up':df<0?'down':''}">${y==2026?'-':(df>0?'+':df<0?'−':'')+won(Math.abs(df))}</td></tr>`}).join('')+'</tbody>';
  const mx=Math.max(...ys.map(y=>R[y].total),1);
  $('bars').innerHTML=ys.map(y=>`<div class="bar"><span>${YR[y].label}</span><i style="width:${R[y].total/mx*100}%"></i><span>${won(R[y].total)}</span></div>`).join('');

  $('propTbl').innerHTML=`<thead><tr><th>아파트</th><th>과세표준</th><th>재산세</th><th>도시지역분</th><th>지방교육세</th><th>합계</th></tr></thead><tbody>`+
    r.apts.map((a,i)=>{const t=r.pts[i];return `<tr><td>${esc(a.name||'아파트 '+(i+1))}<br><small class="sub">공시 ${eok(a.price)} × ${Math.round(t.ratio*100)}%</small></td><td>${won(t.base)}</td><td>${won(t.main)}</td><td>${won(t.city)}</td><td>${won(t.edu)}</td><td><b>${won(t.total)}</b></td></tr>`}).join('')+
    `<tr class="sum"><td>합계</td><td></td><td></td><td></td><td></td><td>${won(r.propSum)}</td></tr></tbody>`;
  const rows=[['공시가격 합계','tot',eok],['기본공제','ded',eok],['공정시장가액비율','fmv',v=>Math.round(v*100)+'%'],['과세표준','base',won],['산출세액','calc',won],['재산세 공제','pded',v=>'−'+won(v)],['세액공제율','credRate',v=>Math.round(v*100)+'%'],['세액공제','cred',v=>'−'+won(v)],['종부세','tax',won],['농어촌특별세','nong',won],['합계','total',won]];
  const who=[['A','본인'],['B','배우자']].filter(([p])=>r.J[p].tot);
  $('jongTbl').innerHTML=who.length?`<thead><tr><th>${YR[year].label}</th>${who.map(([,n])=>`<th>${n}${r.J[who[0][0]].isOne&&n==='본인'?' (1주택)':''}</th>`).join('')}</tr></thead><tbody>`+
    rows.map(([l,k,f])=>`<tr class="${k==='total'?'sum':''}"><td>${l}</td>${who.map(([p])=>`<td>${r.J[p].total||k==='tot'?f(r.J[p][k]):(k==='total'?'0원':'')}</td>`).join('')}</tr>`).join('')+'</tbody>':'<tbody><tr><td>보유 아파트가 없어요</td></tr></tbody>';
  renderSim();
}

/* 집값·주택 수별 표 */
function quick(n){
  for(const b of $('qtab').children)b.setAttribute('aria-pressed',b.dataset.q==n);
  if(n==1){
    $('qnote').textContent='본인 단독명의 1주택, 60세 미만, 보유 5년 미만 기준 (세액공제 없음)';
    const ps=[6,9,12,14,15,18,20,25,30,40];
    const q=(p,y,live)=>compute({ageA:50,ageB:0,apts:[mk(p*E8,{live,hold:0,res:0})]},y).total;
    $('quick').innerHTML=`<thead><tr><th>공시가격</th><th>2026 현행</th><th>2027 실거주</th><th>2027 비거주</th><th>2028 실거주</th><th>2028 비거주</th></tr></thead><tbody>`+
      ps.map(p=>`<tr><td>${p}억원</td><td>${won(q(p,2026,true))}</td><td>${won(q(p,2027,true))}</td><td>${won(q(p,2027,false))}</td><td>${won(q(p,2028,true))}</td><td>${won(q(p,2028,false))}</td></tr>`).join('')+'</tbody>';
    return}
  $('qnote').textContent=`본인 단독명의 ${n}주택, 공시가격 합계를 ${n==2?'사는 집 60% · 다른 집 40%':'사는 집 50% · 나머지 두 채 25%씩'}로 나눈 기준, 비조정지역`;
  const ps=[6,9,12,15,20,25,30,40,50];
  const sp=n==2?[.6,.4]:[.5,.25,.25];
  const q=(p,y,adj)=>compute({ageA:50,ageB:0,apts:sp.map((f,i)=>mk(p*f*E8,{live:i===0,adj,hold:0,res:0}))},y).total;
  const adjCol=n==2;
  $('quick').innerHTML=`<thead><tr><th>공시가격 합계</th><th>2026 현행</th><th>2027 개편안</th><th>2028 개편안${n==3?' (80%)':''}</th>${adjCol?'<th>2028 조정지역</th>':''}</tr></thead><tbody>`+
    ps.map(p=>`<tr><td>${p}억원</td><td>${won(q(p,2026,false))}</td><td>${won(q(p,2027,false))}</td><td>${won(q(p,2028,false))}</td>${adjCol?`<td>${won(q(p,2028,true))}</td>`:''}</tr>`).join('')+'</tbody>';
}
$('qtab').onclick=e=>{const n=e.target.dataset.q;if(n)quick(+n)};
quick(1);

syncAges();drawApts();render();

MBF=()=>['1년 보유세',$('total').textContent];
}
if($('bPrice')){
/* ===== 취득세 ===== */
function acqRate(p){if(p<=6*E8)return .01;if(p>9*E8)return .03;return Math.round((p/E8*2/3-3)*1e4)/1e4/100}
function acq(o){
  const p=o.price, adj=isAdj(o.reg); let rate=acqRate(p), heavy=false;
  if(adj){if(o.n===2&&!o.temp){rate=.08;heavy=true}else if(o.n>=3){rate=.12;heavy=true}}
  else{if(o.n===3){rate=.08;heavy=true}else if(o.n>=4){rate=.12;heavy=true}}
  const tax=p*rate, edu=heavy?p*.004:p*rate*.1;
  const nong=o.big?(heavy?(rate===.08?p*.006:p*.01):p*.002):0;
  const first=(o.first&&o.n===1&&p<=12*E8)?Math.min(tax,2e6):0;
  return {rate,heavy,tax,edu,nong,first,total:tax+edu+nong-first};
}
const B={price:9*E8,n:1,temp:false,reg:'seoul',big:false,first:false};
try{Object.assign(B,JSON.parse(localStorage.getItem('aptTaxB'))||{})}catch(e){}
$('bPrice').value=+(B.price/E8).toFixed(2);$('bTemp').checked=B.temp;$('bFirst').checked=B.first;
function renderB(){
  try{localStorage.setItem('aptTaxB',JSON.stringify(B))}catch(e){}
  segSet('bN',B.n);segSet('bReg',B.reg);segSet('bArea',B.big?1:0);
  $('bTempL').hidden=B.n!==2;$('bFirstL').hidden=B.n!==1;
  $('bPriceH').textContent=eok(B.price);
  const r=acq(B);
  $('bTotal').textContent=won(r.total);
  $('bPct').textContent=B.price?`집값의 ${(r.total/B.price*100).toFixed(2)}% · 취득세율 ${(r.rate*100).toFixed(2).replace(/\.?0+$/,'')}%${r.heavy?' (중과)':''}`:'';
  $('bRows').innerHTML=rowsHtml([['취득세',won(r.tax)],['지방교육세',won(r.edu)],['농어촌특별세',r.nong?won(r.nong):'없음 (85㎡ 이하)'],...(r.first?[['생애최초 감면','−'+won(r.first),'minus']]:[])]);
  const n=[];
  if(r.heavy)n.push(`<b>다주택 중과</b> ${r.rate*100}%가 적용돼요. ${isAdj(B.reg)?'조정대상지역은 2채째부터':'조정대상지역이 아니면 3채째부터'} 중과예요.`);
  else if(B.n===2)n.push(B.temp||!isAdj(B.reg)?`<b>2주택이지만 일반세율</b>이에요. ${B.temp?'일시적 2주택은 기존 집을 기한 안에 못 팔면 중과분을 추징당해요.':'조정대상지역 밖 2주택은 중과가 없어요.'}`:'');
  if(B.price>6*E8&&B.price<=9*E8&&!r.heavy)n.push('<b>6억~9억원</b> 구간은 집값에 따라 세율이 1%에서 3%까지 조금씩 올라가요.');
  if(B.first&&B.n===1)n.push(B.price<=12*E8?'<b>생애최초 감면</b> 최대 200만원. 3년 안에 팔거나 다른 용도로 쓰면 다시 내야 해요.':'<b>생애최초 감면</b>은 12억원 이하 주택만 받을 수 있어요.');
  $('bNotes').innerHTML=n.filter(Boolean).map(x=>`<p class="note">${x}</p>`).join('');
}
$('bPrice').addEventListener('input',e=>{B.price=(parseFloat(e.target.value)||0)*E8;renderB()});
$('bN').onclick=e=>{const v=e.target.closest('button')?.dataset.v;if(v){B.n=+v;renderB()}};
$('bReg').onclick=e=>{const v=e.target.closest('button')?.dataset.v;if(v){B.reg=v;renderB()}};
$('bArea').onclick=e=>{const v=e.target.closest('button')?.dataset.v;if(v){B.big=v==='1';renderB()}};
$('bTemp').onchange=e=>{B.temp=e.target.checked;renderB()};
$('bFirst').onchange=e=>{B.first=e.target.checked;renderB()};
(function(){
  const ps=[3,5,6,7,8,9,10,12,15,20,30];
  const c=[['1주택',{n:1,reg:'seoul'}],['2주택 비조정',{n:2,reg:'etc'}],['2주택 조정',{n:2,reg:'seoul'}],['3주택 비조정',{n:3,reg:'etc'}],['3주택 조정',{n:3,reg:'seoul'}]];
  $('bQuick').innerHTML=`<thead><tr><th>매매가</th>${c.map(([t])=>`<th>${t}</th>`).join('')}</tr></thead><tbody>`+
    ps.map(p=>`<tr><td>${p}억원</td>${c.map(([,o])=>{const r=acq({price:p*E8,big:false,temp:false,first:false,...o});return `<td>${won(r.total)}<br><small class="sub">${(r.rate*100).toFixed(2).replace(/\.?0+$/,'')}%</small></td>`}).join('')}</tr>`).join('')+'</tbody>';
})();


window.__calc.acq=acq;renderB();MBF=()=>['살 때 세금 합계',$('bTotal').textContent];
}
if($('sSale')){
/* ===== 양도세 ===== */
/* 조정대상지역 지정 이력 (국토교통부 공고 기준, 해제일은 그날부터 비조정) */
const LOCS=[
  ['s4','서울 강남·서초·송파·용산',[['2016-11-03',null]]],
  ['s21','서울 그 외 21개 구',[['2016-11-03','2023-01-05'],['2025-10-16',null]]],
  ['gc','경기 과천',[['2016-11-03','2023-01-05'],['2025-10-16',null]]],
  ['sb','경기 성남 분당·수정',[['2016-11-03','2023-01-05'],['2025-10-16',null]]],
  ['hn','경기 하남',[['2016-11-03','2023-01-05'],['2025-10-16',null]]],
  ['gm','경기 광명',[['2017-06-19','2023-01-05'],['2025-10-16',null]]],
  ['sj','경기 성남 중원',[['2016-11-03','2022-11-14'],['2025-10-16',null]]],
  ['ay','경기 안양 동안',[['2018-08-28','2022-11-14'],['2025-10-16',null]]],
  ['sp','경기 수원 팔달',[['2018-12-31','2022-11-14'],['2025-10-16',null]]],
  ['ys','경기 용인 수지',[['2018-12-31','2022-11-14'],['2025-10-16',null]]],
  ['sy','경기 수원 영통·장안',[['2020-02-21','2022-11-14'],['2025-10-16',null]]],
  ['uw','경기 의왕',[['2020-02-21','2022-11-14'],['2025-10-16',null]]],
  ['gr','경기 구리',[['2018-08-28','2022-11-14'],['2026-07-01',null]]],
  ['yg','경기 용인 기흥',[['2018-12-31','2022-11-14'],['2026-07-01',null]]],
  ['dt2','경기 화성 동탄구 (동탄2신도시)',[['2016-11-03','2022-11-14'],['2026-07-01',null]]],
  ['dt1','경기 화성 동탄구 (동탄2 외 지역)',[['2020-06-19','2022-11-14'],['2026-07-01',null]]],
  ['etc','그 외 지역 (지금 비규제)',[]]
];
const LOC=Object.fromEntries(LOCS.map(([k,n,p])=>[k,{n,p}]));
const fmtD=s=>s.replace(/-0?/g,'.').replace(/^(\d{4})\./,'$1.');
const prevDay=s=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)};
function locHist(k){const p=LOC[k].p;return p.length?p.map(([a,b])=>`${fmtD(a)}~${b?fmtD(prevDay(b)):'현재'}`).join(', '):'조정대상지역이었던 적 없음 (2016년 이후 기준)'}
/* 날짜: 'YYYY-MM' 또는 'YYYY-MM-DD' */
function pDate(t){const m=String(t||'').trim().match(/^(\d{4})\D*(\d{1,2})(?:\D*(\d{1,2}))?/);if(!m)return null;
  const y=+m[1],mo=+m[2],d=m[3]?+m[3]:0;if(y<1950||y>2100||mo<1||mo>12||d>31)return null;return {y,mo,d,exact:!!d}}
const key=o=>o.y*10000+o.mo*100+(o.d||15);
const iso=s=>{const [y,m,d]=s.split('-').map(Number);return y*10000+m*100+d};
/* 그 날짜에 조정대상지역이었나? 월만 넣었고 그 달에 지정·해제가 있으면 amb=true */
function adjAt(k,dt){const p=LOC[k].p;let on=false,amb=false;
  for(const [a,b] of p){const A=iso(a),Bk=b?iso(b):Infinity,v=key(dt);if(v>=A&&v<Bk)on=true;
    if(!dt.exact){const ym=dt.y*100+dt.mo;if(Math.floor(A/100)===ym||(b&&Math.floor(Bk/100)===ym))amb=true}}
  return {on,amb}}
/* 보유 햇수(만 나이처럼 꽉 찬 해) */
function fullYears(b,s){let y=s.y-b.y;const bd=b.d||15,sd=s.d||15;if(s.mo<b.mo||(s.mo===b.mo&&sd<bd))y--;return y}
const holdAmb=(b,s)=>(!b.exact||!s.exact)&&b.mo===s.mo;

const BT=[[1400e4,.06],[5000e4,.15],[8800e4,.24],[1.5e8,.35],[3e8,.38],[5e8,.40],[10e8,.42],[INF,.45]];
/* o: sale,buy,cost,hold(꽉 찬 년),res(년),n,temp,adjSale,resReq(거주요건),reform */
function cgt(o){
  const r={gain:0,exempt:false,taxGain:0,ltdR:0,ltd:0,base:0,tax:0,local:0,total:0,heavy:false,add:0,how:'',oneHouse:false};
  r.gain=o.sale-o.buy-(o.cost||0); if(r.gain<=0){r.how='양도차익 없음';return r}
  const one=o.n===1||(o.n===2&&o.temp);
  if(one&&o.hold>=2&&(!o.resReq||o.res>=2)){
    r.oneHouse=true;
    if(o.sale<=12*E8){r.exempt=true;r.how='1세대 1주택 비과세';return r}
    r.taxGain=r.gain*(o.sale-12*E8)/o.sale;
    if(o.hold>=3&&o.res>=2)r.ltdR=Math.min(.4,.04*o.hold)+Math.min(.4,.04*Math.floor(o.res));
    else if(o.hold>=3)r.ltdR=Math.min(.3,.02*o.hold);
    r.how='1주택 고가주택 (12억 초과분만 과세)';
  }else{
    r.taxGain=r.gain;
    r.heavy=o.adjSale&&o.n>=2&&!o.temp;
    if(r.heavy){r.add=o.n>=3?.3:.2;if(o.reform&&o.hold>=2)r.add=o.n>=3?.1:.05}
    if(!r.heavy&&o.hold>=3)r.ltdR=Math.min(.3,.02*o.hold);
    r.how=r.heavy?`조정지역 ${o.n>=3?'3주택+':'2주택'} 중과 +${Math.round(r.add*100)}%p`:(o.n>=2?'다주택 일반과세':'1주택 비과세 요건 미충족');
  }
  r.ltd=r.taxGain*r.ltdR; r.base=Math.max(0,r.taxGain-r.ltd-2.5e6);
  let t=prog(r.base,BT.map(([u,x])=>[u,x+r.add]));
  if(o.hold<2){const st=r.base*(o.hold<1?.7:.6);if(st>t){t=st;r.how+=` · 단기 ${o.hold<1?70:60}%`}}
  r.tax=t;r.local=t*.1;r.total=t+r.local;return r;
}
/* 집 하나 + 팔 때 상황 → cgt 입력 */
function prep(h,sale,n,temp,reform){
  const bd=pDate(h.buyDate),sd=sale;const out={ok:!!(bd&&sd),notes:[]};
  if(!out.ok)return out;
  if(key(bd)>key(sd)){out.ok=false;out.err='산 날짜가 파는 날짜보다 늦어요';return out}
  const hold=fullYears(bd,sd), za=adjAt(h.loc,bd), zs=adjAt(h.loc,sd);
  const resReq=za.on&&key(bd)>=20170803;
  const ref=reform&&key(sd)>=20260510&&key(sd)<=20271231;
  out.hold=hold;out.za=za;out.zs=zs;out.resReq=resReq;
  out.in={sale:h.sale,buy:h.buy,cost:h.cost||0,hold,res:Math.min(h.res||0,hold+.99),n,temp,adjSale:zs.on,resReq,reform:ref};
  if(holdAmb(bd,sd)&&hold>=1)out.notes.push(`파는 달이 산 지 딱 ${hold}년 되는 달이에요. 지금은 ${hold}년 채운 것으로 계산했는데, 산 날보다 하루라도 먼저 팔면 ${hold-1}년이 돼요. 날짜(일)까지 넣으면 정확해요.`);
  if(za.amb)out.notes.push('산 달에 조정대상지역 지정·해제가 있었어요. 날짜(일)까지 넣으면 정확해요.');
  if(!bd.exact&&bd.y===2017&&bd.mo===8&&za.on)out.notes.push('2017년 8월 3일 이후 조정대상지역에서 산 집만 거주요건(2년)이 있어요. 날짜(일)까지 넣으면 정확해요.');
  if((h.res||0)>hold+.99)out.notes.push('산 기간이 보유 기간보다 길어서 보유 기간까지만 인정했어요.');
  if(reform&&key(sd)>=20280101)out.notes.push('2028년 이후 양도는 개편안(장기보유공제 거주 중심 전환 등)을 반영하지 않고 현행 세법으로 계산했어요.');
  return out;
}
const TODAY={y:2026,mo:11,d:0,exact:false};
const S={mode:'one',saleDate:'2026-12',reform:false,sale:15*E8,buy:8*E8,cost:0,buyDate:'2018-06',res:5,n:1,temp:false,loc:'s21',
  list:[{name:'A 아파트',buy:6*E8,sale:14*E8,buyDate:'2015-03',res:10,loc:'s4'},{name:'B 아파트',buy:5*E8,sale:9*E8,buyDate:'2020-06',res:0,loc:'s21'},{name:'C 아파트',buy:3*E8,sale:4*E8,buyDate:'2021-09',res:0,loc:'etc'}],keep:true};
try{const sv=JSON.parse(localStorage.getItem('aptTaxS2'));if(sv)Object.assign(S,sv)}catch(e){}
const locOpts=v=>LOCS.map(([k,n])=>`<option value="${k}"${k===v?' selected':''}>${n}</option>`).join('');
$('sLoc').innerHTML=locOpts(S.loc);
$('sSale').value=+(S.sale/E8).toFixed(2);$('sBuy').value=+(S.buy/E8).toFixed(2);$('sCost').value=S.cost/1e4||0;
$('sBuyDate').value=S.buyDate;$('sRes').value=S.res;$('sTemp').checked=S.temp;$('oKeep').checked=S.keep;$('sSaleDate').value=S.saleDate;$('sReform').checked=S.reform;
function saleD(){const d=pDate(S.saleDate);if(!d)return null;return key(d)<key(TODAY)?null:d}
function renderS(){
  try{localStorage.setItem('aptTaxS2',JSON.stringify(S))}catch(e){}
  segSet('sMode',S.mode);segSet('sN',S.n);
  $('sOne').hidden=S.mode!=='one';$('sOrder').hidden=S.mode!=='order';$('sTempL').hidden=S.n!==2;
  $('sLocH').textContent='조정대상지역 기간: '+locHist(S.loc);
  const sd=saleD();
  if(!sd){const msg=pDate(S.saleDate)?'팔 시기는 이번 달(2026-11) 이후로 넣어 주세요.':'팔 시기를 연-월로 넣어 주세요. 예: 2027-03';
    $('sTotal').textContent='—';$('sNet').textContent=msg;$('sRows').innerHTML='';$('sNotes').innerHTML='';$('oBest').innerHTML=`<div class="tot"><div class="sub">${msg}</div></div>`;$('oTbl').innerHTML='';$('oNotes').innerHTML='';$('sHoldH').textContent='';return}
  if(S.mode==='one'){
    const P=prep(S,sd,S.n,S.temp,S.reform);
    if(!P.ok){$('sHoldH').textContent=P.err||'산 날짜를 연-월로 넣어 주세요. 예: 2019-05';$('sTotal').textContent='—';$('sNet').textContent='';$('sRows').innerHTML='';$('sNotes').innerHTML='';return}
    $('sHoldH').textContent=`보유 ${P.hold}년 (꽉 찬 햇수) · 살 때 ${P.za.on?'조정대상지역':'비조정지역'} · 팔 때 ${P.zs.on?'조정대상지역':'비조정지역'}`;
    const r=cgt(P.in);
    $('sTotal').textContent=won(r.total);
    $('sNet').textContent=r.gain>0?`시세차익 ${eok(r.gain)} 중 ${r.exempt?'세금 0원':Math.round(r.total/r.gain*100)+'%가 세금'} · ${r.how}`:'양도차익이 없어요';
    $('sRows').innerHTML=r.exempt||r.gain<=0?rowsHtml([['양도차익',won(Math.max(0,r.gain))],['결과',r.exempt?'비과세 (12억원 이하)':'세금 없음']]):rowsHtml([
      ['양도차익',won(r.gain)],...(r.oneHouse?[['과세되는 차익 (12억 초과분)',won(r.taxGain)]]:[]),
      ['장기보유특별공제'+(r.ltdR?` ${Math.round(r.ltdR*100)}%`:''),r.ltd?'−'+won(r.ltd):(r.heavy?'없음 (중과)':'없음 (3년 미만)'),r.ltd?'minus':''],['기본공제','−'+won(2.5e6),'minus'],
      ['과세표준',won(r.base)],['양도소득세',won(r.tax)],['지방소득세 (10%)',won(r.local)]]);
    const n=[...P.notes];
    if(r.heavy)n.push(`<b>조정대상지역 다주택 중과</b>: 기본세율에 ${Math.round(r.add*100)}%p를 더하고 장기보유특별공제를 빼요.${P.in.reform?' (개편안: 2027년 세율 +5%p/+10%p, 2026.5.10 이후 양도분 소급 — 국회 통과 전)':' 2026년 5월 10일 양도분부터 다시 적용 중이에요.'}`);
    else if(S.n>=2&&!P.zs.on)n.push('<b>파는 집이 비조정지역</b>이라 다주택이어도 중과가 없어요.');
    if(one1(S)&&P.resReq&&S.res<2&&P.hold>=2)n.push('<b>조정대상지역일 때 산 집</b>은 2년 이상 살아야 1주택 비과세를 받아요 (2017.8.3 이후 취득분).');
    if(one1(S)&&!P.resReq&&P.hold>=2&&r.oneHouse)n.push(`<b>살 때 ${P.za.on?'2017.8.3 이전 취득':'비조정지역'}</b>이라 거주하지 않아도 2년 보유로 비과세 요건을 채워요.`);
    if(one1(S)&&P.hold<2)n.push('<b>2년 미만 보유</b>는 1주택이어도 비과세가 안 되고 단기 세율(1년 미만 70%, 2년 미만 60%)이 붙어요.');
    if(r.oneHouse&&!r.exempt)n.push('<b>1주택 고가주택</b>: 12억원 넘는 부분만 과세하고, 2년 이상 살았다면 보유 연 4% + 거주 연 4% (최대 80%) 공제예요.');
    $('sNotes').innerHTML=n.map(x=>`<p class="note">${x}</p>`).join('');
  }else renderOrder();
}
const one1=s=>s.n===1||(s.n===2&&s.temp);
function perms(a){if(a.length<=1)return [a];return a.flatMap((x,i)=>perms([...a.slice(0,i),...a.slice(i+1)]).map(p=>[x,...p]))}
function renderOrder(){
  $('oList').innerHTML=S.list.map((h,i)=>`<div class="apt" data-o="${i}">
    <div class="hd"><input class="nm" data-f="name" value="${esc(h.name)}" aria-label="이름">${S.list.length>2?`<button class="x" type="button" data-del="${i}">삭제</button>`:''}</div>
    <div class="grid">
      <label>산 가격 (억)<input data-f="buy" type="number" inputmode="decimal" step="0.1" value="${+(h.buy/E8).toFixed(2)}"></label>
      <label>팔 가격 (억)<input data-f="sale" type="number" inputmode="decimal" step="0.1" value="${+(h.sale/E8).toFixed(2)}"></label>
      <label>산 날짜 (연-월)<input data-f="buyDate" inputmode="numeric" value="${esc(h.buyDate||'')}" placeholder="2019-05"></label>
      <label>실제 산 기간 (년)<input data-f="res" type="number" inputmode="decimal" step="0.5" value="${h.res}"></label>
    </div>
    <label style="margin-top:8px">위치<select data-f="loc">${locOpts(h.loc)}</select></label>
  </div>`).join('');
  calcOrder();
}
function calcOrder(){
  const L=S.list, sd=saleD(); if(!sd)return;
  const idx=L.map((_,i)=>i), res=[], notes=new Set(); let bad=null;
  for(const p of perms(idx)){
    const sold=S.keep?p.slice(0,-1):p; let tot=0; const steps=[];
    for(let k=0;k<sold.length;k++){const i=sold[k],P=prep(L[i],sd,L.length-k,false,S.reform);
      if(!P.ok){bad=`${L[i].name}: ${P.err||'산 날짜를 연-월로 넣어 주세요'}`;break}
      P.notes.forEach(x=>notes.add(`${esc(L[i].name)} — ${x}`));
      const r=cgt(P.in);tot+=r.total;steps.push({i,r})}
    if(bad)break;
    res.push({sold,steps,tot,kept:S.keep?p[p.length-1]:null});
  }
  if(bad){$('oBest').innerHTML=`<div class="tot"><div class="sub">${esc(bad)}</div></div>`;$('oTbl').innerHTML='';$('oNotes').innerHTML='';return}
  const seen=new Set(),U=res.filter(x=>{const k=x.sold.join('-')+'|'+x.kept;if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>a.tot-b.tot);
  const best=U[0],worst=U[U.length-1], nm=i=>esc(L[i].name||'아파트 '+(i+1));
  $('oBest').innerHTML=`<div class="ph"><span>세금이 가장 적은 순서</span><span>${S.reform?'개편안 통과 가정':'현행 세법'}</span></div>
    <div class="tot"><div class="steps">${best.steps.map((s,k)=>`<span class="st"><i>${k+1}</i>${nm(s.i)}<small>${won(s.r.total)}</small></span>`).join('<span class="arr">→</span>')}${best.kept!=null?`<span class="arr">·</span><span class="st keep"><i>✓</i>${nm(best.kept)}<small>계속 보유</small></span>`:''}</div>
    <div class="sub" style="margin-top:14px">총 양도세 (지방소득세 포함)</div><div class="big">${won(best.tot)}</div>
    ${U.length>1&&worst.tot>best.tot?`<span class="delta down">가장 비싼 순서보다 ${won(worst.tot-best.tot)} 아껴요</span>`:''}</div>`;
  $('oNotes').innerHTML=[...notes].map(x=>`<p class="note">${x}</p>`).join('');
  $('oTbl').innerHTML=`<thead><tr><th>순위</th><th>파는 순서</th><th>계속 보유</th><th>단계별 세금</th><th>합계</th></tr></thead><tbody>`+
    U.map((x,k)=>`<tr class="${k===0?'sel':''}"><td>${k+1}위</td><td>${x.sold.map(nm).join(' → ')}</td><td>${x.kept!=null?nm(x.kept):'-'}</td><td>${x.steps.map(s=>`${nm(s.i)} ${won(s.r.total)}<br><small class="sub">${s.r.how}</small>`).join('<br>')}</td><td><b>${won(x.tot)}</b></td></tr>`).join('')+'</tbody>';
}
for(const [id,k,m] of [['sSale','sale',E8],['sBuy','buy',E8],['sCost','cost',1e4],['sRes','res',1]])
  $(id).addEventListener('input',e=>{S[k]=(parseFloat(e.target.value)||0)*m;renderS()});
$('sBuyDate').addEventListener('input',e=>{S.buyDate=e.target.value;renderS()});
$('sSaleDate').addEventListener('input',e=>{S.saleDate=e.target.value;renderS()});
$('sLoc').onchange=e=>{S.loc=e.target.value;renderS()};
$('sReform').onchange=e=>{S.reform=e.target.checked;renderS()};
$('sMode').onclick=e=>{const v=e.target.closest('button')?.dataset.v;if(v){S.mode=v;renderS()}};
$('sN').onclick=e=>{const v=e.target.closest('button')?.dataset.v;if(v){S.n=+v;renderS()}};
$('sTemp').onchange=e=>{S.temp=e.target.checked;renderS()};
$('oKeep').onchange=e=>{S.keep=e.target.checked;renderS()};
$('oAdd').onclick=()=>{if(S.list.length>=5)return;S.list.push({name:String.fromCharCode(65+S.list.length)+' 아파트',buy:3*E8,sale:4*E8,buyDate:'2022-01',res:0,loc:'etc'});renderS()};
$('oList').addEventListener('input',e=>{const f=e.target.dataset.f,box=e.target.closest('[data-o]');if(!f||!box)return;const h=S.list[+box.dataset.o];
  if(f==='name'||f==='buyDate'||f==='loc')h[f]=e.target.value;else h[f]=(parseFloat(e.target.value)||0)*(f==='buy'||f==='sale'?E8:1);
  try{localStorage.setItem('aptTaxS2',JSON.stringify(S))}catch(x){}calcOrder()});
$('oList').addEventListener('click',e=>{const b=e.target.closest('button');const box=b?.closest('[data-o]');if(!box)return;const i=+box.dataset.o;
  if(b.dataset.del!==undefined){S.list.splice(i,1);renderS()}});
window.__calc.cgt=cgt;window.__calc.prep=prep;window.__calc.adjAt=adjAt;window.__calc.pDate=pDate;window.__calc.fullYears=fullYears;


renderS();MBF=()=>S.mode==='order'?['가장 적은 순서 양도세',($('oBest').querySelector('.big')||{}).textContent||'—']:['낼 양도세',$('sTotal').textContent];MBT=()=>S.mode==='order'?$('oBest'):$('sOne').querySelector('.paper');
}
if($('rBal')){
/* ===== 금리 계산기 ===== */
function loan(P,ratePct,years,method){
  const n=years*12,i=ratePct/1200;
  if(method==='pr'){const first=P/n+P*i;return {first,month:first,totalInt:P*i*(n+1)/2}}
  const m=i?P*i/(1-Math.pow(1+i,-n)):P/n;return {first:m,month:m,totalInt:m*n-P}
}
const RS={bal:6.5e8,rate:4.75,delta:.5,years:30,method:'eq'};
try{Object.assign(RS,JSON.parse(localStorage.getItem('aptTaxR'))||{})}catch(e){}
const pct=v=>(+v.toFixed(2)).toString();
function renderR(src){
  try{localStorage.setItem('aptTaxR',JSON.stringify(RS))}catch(e){}
  if(src!=='balN')$('rBalN').value=+(RS.bal/E8).toFixed(2);
  if(src!=='rateN')$('rRateN').value=pct(RS.rate);
  $('rBal').value=Math.min(15,Math.max(.5,RS.bal/E8));$('rRate').value=Math.min(9,Math.max(1,RS.rate));
  for(const el of [$('rBal'),$('rRate')]){const p=(el.value-el.min)/(el.max-el.min)*100;el.style.setProperty('--p',p+'%')}
  segSet('rDelta',RS.delta);segSet('rYears',RS.years);segSet('rMethod',RS.method);
  const r2=Math.max(0,RS.rate+RS.delta),a=loan(RS.bal,RS.rate,RS.years,RS.method),b=loan(RS.bal,r2,RS.years,RS.method),d=b.month-a.month,up=d>=0;
  $('rPh').textContent=RS.method==='eq'?'원리금균등':'원금균등 · 첫 달';
  $('rLead').textContent=up?'금리 오른 뒤 한 달에 더 내는 돈':'금리 내린 뒤 한 달에 덜 내는 돈';
  $('rDiff').textContent=(up?'+':'−')+won(Math.abs(d));$('rDiff').className='big '+(up?'upc':'downc');
  $('rSub').textContent=`1년이면 ${up?'+':'−'}${won(Math.abs(d*12))}`;
  const mx=Math.max(a.month,b.month,1);
  $('rBars').innerHTML=[[`지금 (${pct(RS.rate)}%)`,a.month,'b0'],[`바뀐 뒤 (${pct(r2)}%)`,b.month,up?'b1':'b2']].map(([l,v,c])=>`<div class="cb"><div class="cbl"><span>${l}</span><b>${won(v)}</b></div><i class="${c}" style="width:${v/mx*100}%"></i></div>`).join('');
  $('rRows').innerHTML=rowsHtml([['첫 달 이자 변화',(up?'+':'−')+won(Math.abs(RS.bal*RS.delta/1200))],['남은 기간 총이자 변화',(b.totalInt>=a.totalInt?'+':'−')+won(Math.abs(b.totalInt-a.totalInt))],['남은 기간 총이자 (바뀐 뒤)',won(b.totalInt)]]);
  $('rNote').textContent=RS.method==='eq'?'남은 기간 그대로 원리금균등으로 다시 계산했고, 바뀐 금리가 끝까지 유지된다고 가정했어요.':'원금균등은 매달 상환액이 줄어들어서 첫 달 금액으로 비교했어요. 바뀐 금리가 끝까지 유지된다고 가정했어요.';
  $('rQsub').textContent=`대출 ${eok(RS.bal)}, 남은 기간 ${RS.years}년, ${RS.method==='eq'?'원리금균등':'원금균등(첫 달)'} 기준`;
  const rs=[];for(let x=Math.max(.5,Math.round((RS.rate-1.5)*4)/4);x<=RS.rate+2.01;x+=.25)rs.push(+x.toFixed(2));
  $('rQuick').innerHTML=`<thead><tr><th>금리</th><th>월 상환액</th><th>지금보다</th></tr></thead><tbody>`+rs.map(x=>{const m=loan(RS.bal,x,RS.years,RS.method).month,df=m-a.month;return `<tr class="${Math.abs(x-RS.rate)<.001?'sel':''}"><td>${pct(x)}%</td><td>${won(m)}</td><td class="${df>0.5?'up':df<-0.5?'down':''}">${Math.abs(df)<0.5?'-':(df>0?'+':'−')+won(Math.abs(df))}</td></tr>`}).join('')+'</tbody>';
  mbar();
}
$('rBal').addEventListener('input',e=>{RS.bal=+e.target.value*E8;renderR()});
$('rRate').addEventListener('input',e=>{RS.rate=+e.target.value;renderR()});
$('rBalN').addEventListener('input',e=>{const v=parseFloat(e.target.value);if(v>0){RS.bal=v*E8;renderR('balN')}});
$('rRateN').addEventListener('input',e=>{const v=parseFloat(e.target.value);if(v>=0&&v<=30){RS.rate=v;renderR('rateN')}});
$('rDelta').onclick=e=>{const v=e.target.closest('button')?.dataset.v;if(v){RS.delta=+v;renderR()}};
$('rYears').onclick=e=>{const v=e.target.closest('button')?.dataset.v;if(v){RS.years=+v;renderR()}};
$('rMethod').onclick=e=>{const v=e.target.closest('button')?.dataset.v;if(v){RS.method=v;renderR()}};
window.__calc.loan=loan;


renderR();MBF=()=>['한 달 상환액 변화',$('rDiff').textContent];
}
if($('mbar')){
  if(!MBF)$('mbar').remove();else{
  $('mbar').onclick=()=>{const t=MBT?MBT():document.querySelector('main .paper');t&&t.scrollIntoView({behavior:'smooth',block:'center'})};
  const vis=new Set(),io=new IntersectionObserver(es=>{for(const e of es){e.isIntersecting?vis.add(e.target):vis.delete(e.target)}$('mbar').classList.toggle('off',vis.size>0)},{threshold:.35});
  document.querySelectorAll('main .paper').forEach(p=>io.observe(p));
  document.addEventListener('input',()=>setTimeout(mbar,0));document.addEventListener('click',()=>setTimeout(mbar,0));
  mbar();}
}
}
