#!/usr/bin/env node
/*
  Gera uma demo personalizada a partir do index.html modelo.

  Uso:  node gerar-demo.js dados/exemplo.json
  Saída: demos/<slug-da-pousada>/index.html (+ img/ se houver fotos)
*/
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RAIZ = __dirname;
const MODELO = path.join(RAIZ, "index.html");

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("Uso: node gerar-demo.js dados/minha-pousada.json");
  process.exit(1);
}

const dados = JSON.parse(fs.readFileSync(arquivo, "utf8"));
if (!dados.nome) {
  console.error('O JSON precisa ter pelo menos o campo "nome".');
  process.exit(1);
}

const slug = (dados.slug || dados.nome)
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

let html = fs.readFileSync(MODELO, "utf8");

/* ---------- CONFIG ---------- */
const reConfig = /const CONFIG = \{[\s\S]*?\n\};/;
const blocoConfig = html.match(reConfig);
if (!blocoConfig) throw new Error("Não achei o bloco CONFIG no index.html");
const padrao = vm.runInNewContext("(" + blocoConfig[0].replace(/^const CONFIG = /, "").replace(/;$/, "") + ")");

const so = s => String(s ?? "").replace(/\D/g, "");
const config = { ...padrao };
for (const k of Object.keys(padrao)) if (k !== "fotos" && dados[k] != null) config[k] = String(dados[k]);
if (dados.whatsapp) config.whatsapp = so(dados.whatsapp);
if (dados.instagram) config.instagram = String(dados.instagram).replace(/^@/, "");
if (dados.precos) {
  if (dados.precos.jardim) config.precoJardim = dados.precos.jardim;
  if (dados.precos.mar) config.precoMar = dados.precos.mar;
  if (dados.precos.chale) config.precoChale = dados.precos.chale;
}
if (dados.whatsapp && !dados.whatsappTexto) {
  const n = so(dados.whatsapp).replace(/^55/, "");
  config.whatsappTexto = n.length === 11 ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}` : dados.whatsapp;
}

/* ---------- Fotos: copia pra demos/<slug>/img/ ---------- */
const destino = path.join(RAIZ, "demos", slug);
fs.mkdirSync(destino, { recursive: true });
config.fotos = { ...padrao.fotos };
for (const [chave, src] of Object.entries(dados.fotos || {})) {
  if (!src || !(chave in config.fotos)) continue;
  if (/^https?:\/\//.test(src)) { config.fotos[chave] = src; continue; }
  const origem = path.resolve(RAIZ, src);
  if (!fs.existsSync(origem)) { console.warn(`Aviso: foto não encontrada (${src}), usando ilustração.`); continue; }
  fs.mkdirSync(path.join(destino, "img"), { recursive: true });
  fs.copyFileSync(origem, path.join(destino, "img", path.basename(origem)));
  config.fotos[chave] = "img/" + path.basename(origem);
}

const js = v => JSON.stringify(v);
const linhas = Object.entries(config).filter(([k]) => k !== "fotos").map(([k, v]) => `  ${k}: ${js(v)},`);
const fotos = Object.entries(config.fotos).map(([k, v]) => `    ${k}: ${js(v)}`).join(",\n");
const novoConfig = `const CONFIG = {\n${linhas.join("\n")}\n  fotos: {\n${fotos}\n  }\n};`;
html = html.replace(reConfig, () => novoConfig);

/* ---------- Cores do :root ---------- */
for (const [nome, cor] of Object.entries(dados.cores || {})) {
  html = html.replace(new RegExp(`(:root\\{[\\s\\S]*?--${nome}:)[^;]+;`), `$1${cor};`);
}

/* ---------- Textos fixos (aparecem antes do JS e na prévia do link) ---------- */
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(config.nome + " — " + config.cidade)}</title>`);
for (const k of ["nome", "nota", "avaliacoes", "precoJardim", "precoMar", "precoChale"]) {
  html = html.replace(new RegExp(`(data-cfg="${k}"[^>]*>)[^<]*`, "g"), (_, a) => a + esc(config[k]));
}

fs.writeFileSync(path.join(destino, "index.html"), html);
console.log(`Demo gerada: demos/${slug}/index.html`);
console.log(`Publicar:    vercel deploy demos/${slug} --prod --yes --project demo-${slug}`);
