(function(root){
'use strict';
const KEY='utanai-yusha-v1';
const empty=()=>({version:1,days:{},money:{daily:0,monthly:0,actual:0},notes:{reason:'',regret:'',plan:''},cooldowns:[],timer:null});
function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return !isNaN(d)&&dateKey(d)===s;}
function number(v,max=10000000){if(!['number','string'].includes(typeof v))throw Error('数値を入力してください。');if(typeof v==='string'&&!v.trim())throw Error('数値を入力してください。');const n=Number(v);if(!Number.isFinite(n)||n<0||n>max)throw Error(`0〜${max.toLocaleString()}の数値を入力してください。`);return n;}
function intensity(v){const n=number(v,10);if(!Number.isInteger(n))throw Error('衝動の強さは0〜10の整数で入力してください。');return n;}
function validate(x){if(!x||x.version!==1||!x.days||typeof x.days!=='object'||Array.isArray(x.days)||!x.money||typeof x.money!=='object'||Array.isArray(x.money)||!x.notes||typeof x.notes!=='object'||Array.isArray(x.notes)||!Array.isArray(x.cooldowns))throw Error('対応するJSONデータではありません。');const out=empty();for(const [k,v]of Object.entries(x.days)){if(!validDate(k)||k>dateKey()||!['free','played'].includes(v))throw Error('日付または記録が不正です。');out.days[k]=v;}for(const k of Object.keys(out.money)){out.money[k]=number(x.money[k]);if(!Number.isInteger(out.money[k]))throw Error('金額は整数の円で入力してください。');}for(const k of Object.keys(out.notes)){if(typeof x.notes[k]!=='string'||x.notes[k].length>2000)throw Error('メッセージは各2000文字以内です。');out.notes[k]=x.notes[k];}if(x.cooldowns.length>10000)throw Error('記録数が上限を超えています。');out.cooldowns=x.cooldowns.map(c=>{if(!c||!Number.isFinite(c.at)||c.at<0)throw Error('クールダウンの記録が不正です。');return {at:c.at,before:intensity(c.before),after:intensity(c.after)};});if(x.timer!==null){const t=x.timer;if(!t||!Number.isFinite(t.end)||t.end<0)throw Error('タイマーが不正です。');out.timer={end:t.end,before:intensity(t.before)};}return out;}
function save(storage,data){const checked=validate(data);storage.setItem(KEY,JSON.stringify(checked));return checked;}
function load(storage){const raw=storage.getItem(KEY);return raw===null?empty():validate(JSON.parse(raw));}
function remaining(end,now=Date.now()){return Math.max(0,Math.ceil((end-now)/1000));}
function future(monthly,rate,years){number(monthly);if(![0,.03,.05,.07].includes(rate)||![5,10,20].includes(years))throw Error('試算条件が不正です。');const r=rate/12,n=years*12;return r===0?monthly*n:monthly*Math.expm1(n*Math.log1p(r))/r;}
function stats(days,today=dateKey()){const entries=Object.entries(days).filter(([k])=>k<=today),free=entries.filter(([,v])=>v==='free').length;let streak=0,d=new Date(today+'T12:00:00');if(!days[today])d.setDate(d.getDate()-1);while(days[dateKey(d)]==='free'){streak++;d.setDate(d.getDate()-1);}return {free,recorded:entries.length,rate:entries.length?Math.round(free/entries.length*100):0,streak};}
const api={KEY,empty,dateKey,validDate,number,intensity,validate,save,load,remaining,future,stats};if(typeof module!=='undefined')module.exports=api;else root.Yusha=api;
})(globalThis);
