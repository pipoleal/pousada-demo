# Pousada Demo

Site de demonstração para pousadas — HTML/CSS/JS puro, tudo no `index.html`.

## Personalizar à mão

- **Dados** (nome, cidade, endereço, WhatsApp, Instagram, preços, nota): edite o objeto `CONFIG` no final do `index.html`.
- **Cores**: edite as variáveis no `:root` do CSS (topo do arquivo):
  `--mata` (títulos/rodapé), `--mar` (destaques), `--sol` (botões), `--espuma` (fundo).
- **Fotos**: coloque os arquivos em `img/` e preencha `CONFIG.fotos` (ex: `piscina: "img/piscina.jpg"`). Campo vazio = usa a ilustração.

## Gerar uma demo personalizada

```bash
node gerar-demo.js dados/exemplo.json
```

Cria `demos/<slug-da-pousada>/index.html` com o CONFIG, as cores e o título já trocados.
Use `dados/exemplo.json` como base. Fotos no JSON (ex: `"piscina": "img/recanto-piscina.jpg"`) são copiadas para a pasta da demo.

## Publicar uma demo na Vercel

```bash
vercel deploy demos/<slug> --prod --yes --project demo-<slug>
```

O link fica `https://demo-<slug>.vercel.app`.
