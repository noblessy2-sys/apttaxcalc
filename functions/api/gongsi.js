/* 아파트 공시가격 조회 (Cloudflare Pages Function)
   GET /api/gongsi?q=주소또는단지명&dong=101&ho=1203
   환경변수: VWORLD_KEY (브이월드 인증키), VWORLD_DOMAIN (인증키에 등록한 도메인, 예: www.example.com)
   데이터: 국토교통부 공동주택가격 (브이월드 국가중점데이터 getApartHousingPriceAttr) */
const V='https://api.vworld.kr';
const nd=s=>String(s??'').replace(/\s/g,'').replace(/^제/,'').replace(/동$/,'').toUpperCase();
const nh=s=>String(s??'').replace(/\s/g,'').replace(/호$/,'').replace(/^0+(?=\d)/,'').toUpperCase();
const byNum=(a,b)=>(parseInt(a)||0)-(parseInt(b)||0)||String(a).localeCompare(String(b));
export async function onRequestGet({request,env}){
  const u=new URL(request.url);
  const q=(u.searchParams.get('q')||'').trim().slice(0,100);
  const dong=(u.searchParams.get('dong')||'').trim().slice(0,20);
  const ho=(u.searchParams.get('ho')||'').trim().slice(0,20);
  const out=(o,status=200,cache=0)=>new Response(JSON.stringify(o),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':cache?`public, max-age=${cache}`:'no-store'}});
  if(!env.VWORLD_KEY)return out({error:'NO_KEY'},500);
  if(!q)return out({error:'NO_QUERY'},400);
  const domain=env.VWORLD_DOMAIN||u.hostname;
  const get=async(path,params)=>{
    const r=await fetch(V+path+'?'+new URLSearchParams({...params,key:env.VWORLD_KEY,domain,format:'json'}),{headers:{Referer:`https://${domain}/`}});
    if(!r.ok)throw new Error('UPSTREAM '+r.status);
    return r.json();
  };
  const items=j=>{const r=j.response||j;if(String(r.status).toUpperCase()!=='OK')return [];let it=r.result&&r.result.items;if(it&&!Array.isArray(it))it=it.item??[it];return Array.isArray(it)?it:it?[it]:[]};
  const search=p=>get('/req/search',{service:'search',request:'search',version:'2.0',errorformat:'json',...p}).then(items);
  async function prices(pnu,year){
    const rows=[];
    for(let page=1;page<=30;page++){
      const j=await get('/ned/data/getApartHousingPriceAttr',{pnu,stdrYear:String(year),numOfRows:'500',pageNo:String(page)});
      const a=j.apartHousingPrices;if(!a)break;
      let f=a.field;if(!f)break;if(!Array.isArray(f))f=[f];
      rows.push(...f);
      if(rows.length>=(+a.totalCount||0)||f.length<500)break;
    }
    return rows.filter(r=>String(r.stdrYear||year)===String(year));
  }
  try{
    let pnu=/^\d{19}$/.test(q)?q:null,addr=null;
    if(!pnu){
      for(const category of /(로|길)\s*\d/.test(q)?['road','parcel']:['parcel','road']){
        const it=await search({type:'address',category,query:q,size:'1'});
        if(it.length&&/^\d{19}$/.test(String(it[0].id))){pnu=String(it[0].id);addr=it[0].address||null;break}
      }
    }
    if(!pnu){
      const it=await search({type:'place',query:q,size:'10'});
      const c=[];const seen=new Set();
      for(const x of it){const p=x.address&&x.address.parcel;if(!p||seen.has(p))continue;seen.add(p);c.push({title:String(x.title||''),parcel:String(p),road:String((x.address&&x.address.road)||'')})}
      if(!c.length)return out({error:'NOT_FOUND'},404);
      return out({candidates:c.slice(0,6)},200,3600);
    }
    const now=new Date(Date.now()+9*3600e3).getUTCFullYear();
    let rows=[],year=null;
    for(const y of [now,now-1]){rows=await prices(pnu,y);if(rows.length){year=y;break}}
    if(!rows.length)return out({error:'NOT_APT',pnu},404);
    const aptName=String(rows[0].aphusNm||'');
    const base={aptName,year,pnu,address:addr};
    const dongs=[...new Set(rows.map(r=>nd(r.dongNm)))].sort(byNum);
    let sel=rows;
    if(dong){sel=rows.filter(r=>nd(r.dongNm)===nd(dong));if(!sel.length)return out({...base,error:'NO_DONG',dongs},200,86400)}
    else if(dongs.length>1)return out({...base,dongs},200,86400);
    const hos=[...new Set(sel.map(r=>nh(r.hoNm)))].sort(byNum);
    if(!ho)return out({...base,dong:nd(sel[0].dongNm),hos},200,86400);
    const m=sel.find(r=>nh(r.hoNm)===nh(ho));
    if(!m)return out({...base,dong:nd(sel[0].dongNm),error:'NO_HO',hos},200,86400);
    return out({...base,match:{dong:nd(m.dongNm),ho:nh(m.hoNm),floor:String(m.floorNm||''),area:+m.prvuseAr||null,price:+m.pblntfPc}},200,86400);
  }catch(e){return out({error:'UPSTREAM'},502)}
}
