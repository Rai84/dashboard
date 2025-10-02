const { createClient } = supabase;

// 🔑 Troque pelas suas chaves
const SUPABASE_URL = "https://fprppmxfxwrswlhsxeww.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnBwbXhmeHdyc3dsaHN4ZXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzQ0OTMsImV4cCI6MjA3NDk1MDQ5M30.Wv918OkNZoFL6lAVkxX-IAxzibyA6qqnqFjZGqb0kSI";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const formVenda = document.getElementById("formVenda");
const selectFuncionario = document.getElementById("funcionario");
const selectMes = document.getElementById("filtroMes");
const tabelaBody = document.querySelector("#tabelaVendas tbody");
const totalGeralEl = document.getElementById("totalGeral");

// Formatar moeda BRL
const brl = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

// Carregar funcionários ativos no select
async function loadFuncionarios() {
  const { data, error } = await db
    .from("funcionarios")
    .select("*")
    .eq("ativo", true);
  if (error) {
    console.error(error);
    return;
  }

  selectFuncionario.innerHTML = "";
  data.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.nome;
    selectFuncionario.appendChild(opt);
  });
}

// Adicionar venda
formVenda.addEventListener("submit", async (e) => {
  e.preventDefault();
  const funcionario_id = selectFuncionario.value;
  const mes = document.getElementById("mes").value;
  const valor = Number(document.getElementById("valor").value);

  if (!funcionario_id || !mes || !valor) return;

  await db.from("vendas").insert([{ funcionario_id, mes, valor }]);
  document.getElementById("valor").value = "";
  loadRelatorio(selectMes.value);
});

// Carregar relatório
async function loadRelatorio(mes) {
  let query = db
    .from("vendas")
    .select("valor, mes, funcionario_id, funcionarios(nome)")
    .eq("funcionarios.ativo", true);

  if (mes !== "Todos") {
    query = query.eq("mes", mes);
  }

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return;
  }

  const totais = {};
  let totalGeral = 0;

  data.forEach((v) => {
    totais[v.funcionarios.nome] =
      (totais[v.funcionarios.nome] || 0) + Number(v.valor);
    totalGeral += Number(v.valor);
  });

  tabelaBody.innerHTML = "";
  for (const [nome, total] of Object.entries(totais)) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${nome}</td><td>${brl(total)}</td>`;
    tabelaBody.appendChild(tr);
  }

  totalGeralEl.textContent = brl(totalGeral);
}

// Filtro de mês
selectMes.addEventListener("change", () => loadRelatorio(selectMes.value));

// Inicialização
loadFuncionarios();
loadRelatorio("Todos");
