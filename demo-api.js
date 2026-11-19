/**
 * Pizzaria Primavera — API de demonstração para GitHub Pages.
 * Apenas apresentação: pedidos ficam neste navegador. Nenhum servidor recebe os dados.
 */
(() => {
  'use strict';
  const nativeFetch = window.fetch.bind(window);
  const KEY = 'primavera-demo-orders-v1';
  const brl = n => Number(n || 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
  const clean = (s, n=500) => String(s ?? '').trim().slice(0, n);
  const readOrders = () => {try {const x = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(x) ? x : [];} catch {return [];}};
  const saveOrders = orders => localStorage.setItem(KEY, JSON.stringify(orders.slice(-60)));
  const response = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json; charset=utf-8'}});
  let menuPromise, settingsPromise;
  const menu = () => menuPromise ||= nativeFetch(new URL('data/menu.json', document.baseURI)).then(r => {if(!r.ok)throw Error('Cardápio indisponível'); return r.json()});
  const settings = () => settingsPromise ||= nativeFetch(new URL('data/settings.json', document.baseURI)).then(r => {if(!r.ok)throw Error('Configurações indisponíveis'); return r.json()});
  const time = (date) => new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hour12:false}).format(date);

  function normalize(body, m, s) {
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 40) throw Error('Adicione um item ao carrinho.');
    const items = body.items.map(p => {
      const quantity = Number(p.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw Error('Quantidade inválida.');
      if (p.type === 'pizza') {
        const sz = m.sizes.find(x => x.id === Number(p.sizeId));
        if (!sz) throw Error('Tamanho de pizza inválido.');
        const ids = Array.isArray(p.flavorIds) ? p.flavorIds.map(Number) : [];
        if (!ids.length || ids.length > sz.maxFlavors || new Set(ids).size !== ids.length) throw Error('Escolha uma combinação válida de sabores.');
        const flavors = ids.map(id => {
          const f = m.flavors.find(x => x.id === id);
          const price = sz.prices[String(id)];
          if (!f || price === undefined) throw Error('Sabor indisponível para este tamanho.');
          return {name:f.name, price:Number(price)};
        });
        const crust = sz.crusts.find(x => x.id === Number(p.crustId));
        const dough = m.doughs.find(x => x.id === Number(p.doughId));
        if (!crust || !dough) throw Error('Escolha uma borda e uma massa válidas.');
        const price = Number((Math.max(sz.basePrice, ...flavors.map(f => f.price)) + Number(crust.price || 0) + Number(dough.price || 0)).toFixed(2));
        return {type:'pizza', quantity, size:sz.name, crust, dough, flavors, price, subtotal:Number((price * quantity).toFixed(2)), notes:clean(p.notes)};
      }
      if (p.type === 'drink') {
        const d = m.drinks.find(x => x.id === Number(p.drinkId));
        if (!d) throw Error('Item indisponível.');
        return {type:'drink', quantity, name:d.name, price:Number(d.price), subtotal:Number((d.price * quantity).toFixed(2))};
      }
      throw Error('Item inválido.');
    });
    const c = body.customer || {};
    const customer = {name:clean(c.name,90),phone:clean(c.phone,20),street:clean(c.street,130),number:clean(c.number,20),complement:clean(c.complement,100),bairro:clean(c.bairro,90),reference:clean(c.reference,130),notes:clean(c.notes,500)};
    if (customer.name.length < 2 || customer.phone.replace(/\D/g,'').length < 10) throw Error('Informe nome e celular válidos.');
    const fulfillment = body.fulfillment === 'pickup' ? 'pickup' : 'delivery';
    if (fulfillment === 'delivery' && (!customer.street || !customer.number || !customer.bairro)) throw Error('Preencha o endereço de entrega.');
    const payment = body.payment === 'Cartão' ? 'Cartão' : 'Dinheiro';
    const paymentCard = body.paymentCard === 'Débito' ? 'Débito' : 'Crédito';
    const change = body.change == null || body.change === '' ? null : Number(body.change);
    const subtotal = Number(items.reduce((sum, x) => sum + x.subtotal, 0).toFixed(2));
    const zone = (s.zones || []).find(z => z.name.toLocaleLowerCase('pt-BR') === customer.bairro.toLocaleLowerCase('pt-BR'));
    const deliveryFee = fulfillment === 'pickup' ? 0 : zone ? Number(zone.fee) : null;
    const total = deliveryFee === null ? null : Number((subtotal + deliveryFee).toFixed(2));
    if (change !== null && (change < (total ?? subtotal) || change > 100000)) throw Error('Valor de troco inválido.');
    return {customer, fulfillment, payment, paymentCard, change, items, subtotal, deliveryFee, total};
  }
  function orderMessage(o, settings) {
    const out = ['✅ NOVO PEDIDO','-----------------------------','▶️ RESUMO DO PEDIDO','',` Pedido #${o.id} (DEMONSTRAÇÃO)`,' -------------------------------',o.total === null ? `▶️ TOTAL PARCIAL = ${brl(o.subtotal)}` : `▶️ TOTAL = ${brl(o.total)}`,' -------------------------------','',' Link para acompanhar status do pedido:',' Indisponível nesta versão de demonstração',''];
    for (const p of o.items) {
      if (p.type === 'pizza') {
        out.push(`${p.quantity}x ${p.size}`,` -${p.crust.name}`,` -${p.dough.name}`,...p.flavors.map(f => ` -${f.name} (${brl(f.price)})`),'',` Subtotal do item: ${brl(p.subtotal)}`);
        if (p.notes) out.push('',` -- Observações: ${p.notes}`);
      } else out.push(`${p.quantity}x ${p.name} (${brl(p.price)})`,'',` Subtotal do item: ${brl(p.subtotal)}`);
      out.push('', ' -  -  -  -  -  -  -  -  -  -  -','');
    }
    out.push('------------------------------------------',o.fulfillment === 'delivery' ? '▶️ Dados para entrega' : '▶️ Dados para retirada','',`Nome: ${o.customer.name}`);
    if (o.fulfillment === 'delivery') out.push(`Endereço: ${o.customer.street}, nº: ${o.customer.number}${o.customer.complement?', '+o.customer.complement:''}`,`Bairro: ${o.customer.bairro}`,`Ponto de Referência: ${o.customer.reference || 'Não informado'}`);
    out.push(`Telefone: ${o.customer.phone}`);
    if (o.customer.notes) out.push(`Observações gerais: ${o.customer.notes}`);
    if (o.fulfillment === 'delivery') {
      out.push('',`Taxa de Entrega: ${o.deliveryFee === null ? 'A CONFIRMAR' : brl(o.deliveryFee)}`);
      const min = settings.deliveryMinutes?.[0] ?? 50, max = settings.deliveryMinutes?.[1] ?? 60;
      out.push('',` 🕙 Tempo de Entrega: aprox. ${time(new Date(Date.now()+min*60000))} a ${time(new Date(Date.now()+max*60000))}`);
    } else out.push('',` 🕙 Tempo de Retirada: aprox. ${settings.pickupMinutes || 20} minutos`);
    out.push('','-------------------------------',o.total === null ? `▶️ TOTAL PARCIAL (sem taxa) = ${brl(o.subtotal)}` : `▶️ TOTAL = ${brl(o.total)}`,'-------------------------------','','▶️ PAGAMENTO','',o.payment === 'Dinheiro' ? 'Pagamento em Dinheiro' : `Pagamento em Cartão (${o.paymentCard})`);
    if (o.payment === 'Dinheiro' && o.change !== null) {out.push(`Troco para ${brl(o.change)}`);if(o.total !== null) out.push(`Troco a levar: ${brl(o.change-o.total)}`);}
    if (o.deliveryFee === null && o.fulfillment === 'delivery') out.push('⚠️ A taxa de entrega será confirmada pela pizzaria.');
    out.push('','*** PEDIDO SIMULADO PARA APRESENTAÇÃO — NÃO É UMA SOLICITAÇÃO REAL ***');
    return out.join('\n');
  }
  async function dispatch(url, opts) {
    try {
      if (url.pathname === '/api/menu') return response(await menu());
      if (url.pathname === '/api/settings') {
        const s = await settings();
        return response({zones:s.zones,deliveryMinutes:s.deliveryMinutes,pickupMinutes:s.pickupMinutes,hours:s.hours});
      }
      if (url.pathname === '/api/orders' && opts.method === 'POST') {
        const body = JSON.parse(opts.body || '{}'), m = await menu(), s = await settings();
        const o = normalize(body,m,s), orders = readOrders();
        o.id = Math.max(0, ...orders.map(x => x.id || 0)) + 1;
        o.token = crypto.randomUUID();
        o.status = 'Aguardando confirmação';
        o.createdAt = new Date().toISOString();
        o.updatedAt = o.createdAt;
        orders.push(o); saveOrders(orders);
        const link = new URL('acompanhar.html', location.href);
        link.searchParams.set('id', String(o.id)); link.searchParams.set('token', o.token);
        const text = encodeURIComponent(orderMessage(o,s));
        const digits = String(s.whatsapp || '').replace(/\D/g, '');
        return response({id:o.id, token:o.token, trackUrl:link.href, whatsappUrl:`https://wa.me/${digits}?text=${text}`, status:o.status}, 201);
      }
      const match = url.pathname.match(/^\/api\/orders\/(\d+)$/);
      if (match) {
        const o = readOrders().find(x => x.id === Number(match[1]) && x.token === url.searchParams.get('token'));
        if (!o) return response({error:'Pedido não encontrado nesta demonstração.'},404);
        return response({id:o.id,status:o.status,createdAt:o.createdAt,updatedAt:o.updatedAt,fulfillment:o.fulfillment,customerName:o.customer.name,items:o.items.map(p=>({name:p.type==='pizza'?`Pizza ${p.size}`:p.name,quantity:p.quantity,flavors:p.flavors?.map(f=>f.name)||[]})),subtotal:o.subtotal,deliveryFee:o.deliveryFee,total:o.total});
      }
      return response({error:'Função indisponível no GitHub Pages.'},404);
    } catch(e) {return response({error:e.message || 'Falha no pedido de demonstração.'},400);}
  }
  window.fetch = (input, init={}) => {
    const raw = typeof input === 'string' ? input : input?.url;
    if (!raw) return nativeFetch(input,init);
    const url = new URL(raw,location.href);
    if (!url.pathname.startsWith('/api/')) return nativeFetch(input,init);
    return dispatch(url,{method:String(init.method || 'GET').toUpperCase(),body:init.body});
  };
})();
