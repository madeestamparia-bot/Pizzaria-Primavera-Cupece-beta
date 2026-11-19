# Pizzaria Primavera Cupecê — Demonstração V5

Site estático para **GitHub Pages**, com identidade escura baseada no logotipo da Primavera: preto, vermelho e dourado.

## O fundo geométrico

O padrão de losangos NÃO é uma foto, nem um PNG. Ele é desenhado dentro da folha `primavera-v5.css`, com os gradientes nas variáveis `--diamond-lines` e `--diamond-facets`. Basta ajustar cores e escala nessas variáveis para personalizar a geometria.

## Funcionalidades

- 86 sabores de pizzas Grande/Broto, 56 esfihas, beirutes e combos importados do cardápio enviado.
- Monte uma pizza com um, dois ou três sabores (limites por tamanho) e visualize as partes.
- Borda recheada, massa, observações, carrinho e checkout.
- Mensagem de WhatsApp formatada automaticamente.
- Preços da pizza por sabor de maior valor, conforme lógica reaproveitada do site anterior; **confirmar essa regra com a pizzaria antes de vender**.

## Publicação

Extraia todos os arquivos na raiz do repositório e ative Settings → Pages → Deploy from a branch → main /(root). O `index.html` já está na raiz.

## Atenção: versão demonstrativa

- Pedidos e acompanhamento ficam só no **localStorage deste navegador**; não há painel servidor nem gestão compartilhada.
- O WhatsApp real aparece como contato no layout, mas o destino de envio foi deixado vazio em `data/settings.json` para evitar que pedidos simulados sejam enviados à pizzaria. A apresentação ainda abre a mensagem pronta no WhatsApp.
- A taxa de entrega permanece “a confirmar” por bairro enquanto não houver uma tabela conferida.
- Fotos de pizza são **ilustrativas** e nem todas correspondem à receita real. Para esfihas e combos, usei ilustrações vetoriais da interface em vez de fotos incorretas.
- O portal informado `pedir.delivery/app/pizzariaprimaveracupece/menu` exibiu apenas a tela inicial “Carregando o cardápio…” na consulta pública. Os dados do catálogo foram extraídos das fotos de cardápio fornecidas, e devem ser validados.
