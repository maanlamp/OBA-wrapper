//Copied from
//https://gist.github.com/revolunet/843889#gistcomment-2795911
//Slightly edited and minified :)

export default class LWZ{static compress(t){if(!t)return t;const e=new Map,r=(t+"").split("");let s,h=[],l=r[0],n=256;for(let t=1;t<r.length;t++)s=r[t],e.has(l+s)?l+=s:(h.push(l.length>1?e.get(l):l.charCodeAt(0)),e.set(l+s,n),n++,l=s);h.push(l.length>1?e.get(l):l.charCodeAt(0));for(let t=0;t<h.length;t++)h[t]=String.fromCharCode(h[t]);return h.join("")}static decompress(t){const e=new Map,r=(t+"").split("");let s,h=r[0],l=h,n=[h],o=256;for(let t=1;t<r.length;t++){let a=r[t].charCodeAt(0);s=a<256?r[t]:e.has(a)?e.get(a):l+h,n.push(s),h=s.charAt(0),e.set(o,l+h),o++,l=s}return n.join("")}};