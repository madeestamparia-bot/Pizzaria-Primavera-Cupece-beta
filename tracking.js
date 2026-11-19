'use strict';
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const icon = name => `<svg class="ui-icon" aria-hidden="true" focusable="false"><use href="assets/icons.svg?v=3.1#${name}"></use></svg>`;
const money = value => Number(value || 0).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
const params = new URLSearchParams(location.search);
const id = params.get('id'), token = params.get('token');
const all = ['Aguardando confirmação','Recebido','Em preparo','Saiu para entrega','Concluído'];
async function load(){
  if(!id || !token){
    let recent=[];
    try{recent=JSON.parse(localStorage.getItem('primavera-recent')||'[]')}catch{}
    $('#tracker').innerHTML = `<h2 style="margin:0">Seus pedidos recentes</h2><p style="font-size:13px;color:#8b7667">Os pedidos desta demonstração só podem ser vistos neste navegador; não existe acompanhamento compartilhado.</p>`+
      (recent.length ? recent.map(x=>`<a class="recent-order" href="${escape(x.trackUrl)}"><b>Pedido #${Number(x.id)}</b><span style="color:#be3225">Acompanhar ${icon('arrow-right')}</span></a>`).join('') : '<p style="font-size:13px">Ainda não há pedidos salvos neste navegador.</p>')+
      `<a href="index.html" class="tracker-back">${icon('arrow-left')} Voltar ao cardápio</a>`;
    return;
  }
  try{
    const r=await fetch(`/api/orders/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`,{cache:'no-store'});
    if(!r.ok) throw new Error('Pedido não encontrado. Confira se o link está completo.');
    const o=await r.json();
    const rejected=o.status==='Cancelado';
    const list=o.fulfillment==='pickup'?all.map(x=>x==='Saiu para entrega'?'Pronto para retirada':x):all;
    const pos=list.indexOf(o.status);
    $('#tracker').innerHTML=`<p style="font-size:11px;color:#a77d66;font-weight:900;letter-spacing:2px">PEDIDO #${Number(o.id)}</p><h2 style="font:900 27px Outfit;margin:5px 0">${escape(o.status)}</h2><p style="font-size:13px;color:#8b7564">${escape(o.customerName)} · ${new Date(o.createdAt).toLocaleString('pt-BR')}</p>`+
      (rejected?'<p style="color:#bd3324;font-weight:800">Este pedido foi cancelado. Entre em contato com a pizzaria pelo WhatsApp.</p>':`<div style="margin-top:25px">${list.map((st,i)=>`<div class="status-row ${i<=pos?'done':''}"><span class="status-dot">${icon('check')}</span><span><strong>${escape(st)}</strong><p>${i<=pos?'Etapa atualizada pela pizzaria.':'Aguardando esta etapa.'}</p></span></div>`).join('')}</div>`)+
      `<h3 style="font:900 17px Outfit;margin-top:23px">Seu pedido</h3>${o.items.map(p=>`<p style="font-size:13px">${Number(p.quantity)}x ${escape(p.name)}${p.flavors.length?' — '+p.flavors.map(escape).join(' / '):''}</p>`).join('')}<div class="total-line final"><span>${o.total===null?'Subtotal (taxa a confirmar)':'Total'}</span><strong>${money(o.total??o.subtotal)}</strong></div><a href="index.html" class="btn btn-gold" style="margin-top:14px">Voltar ao cardápio ${icon('arrow-up-right')}</a><p style="color:#9e8b7e;font-size:11px;line-height:1.6">Demonstração: o pedido é armazenado apenas neste navegador. Não há painel de produção nem acompanhamento em outros dispositivos.</p>`;
  }catch(e){
    $('#tracker').innerHTML=`<h2>Não encontramos seu pedido</h2><p style="font-size:13px">${escape(e.message)}</p><a href="index.html" class="btn btn-gold">Voltar ao cardápio ${icon('arrow-left')}</a>`;
  }
}
load();

