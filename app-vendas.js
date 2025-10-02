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

// ================== FUNCIONÁRIOS ==================
async function loadFuncionarios() {
  const { data, error } = await db
    .from("funcionarios")
    .select("*")
    .eq("ativo", true)
    .eq("tipo", "vendedora");

  if (error) {
    console.error(error);
    return;
  }

  selectFuncionario.innerHTML = '<option value="">-- Selecione --</option>';
  data.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.nome;
    selectFuncionario.appendChild(opt);
  });
}

// ================== ADICIONAR VENDA ==================
formVenda.addEventListener("submit", async (e) => {
  e.preventDefault();

  const funcionario_id = selectFuncionario.value;
  const mes = document.getElementById("mes").value;
  const valor = Number(document.getElementById("valor").value);
  const status = document.getElementById("status").value;
  const operadora = document.getElementById("operadora").value;

  if (!funcionario_id || !mes || !valor || !status) {
    alert("Preencha todos os campos obrigatórios!");
    return;
  }

  const { error } = await db
    .from("vendas")
    .insert([{ funcionario_id, mes, valor, status, operadora }]);

  if (error) {
    console.error("Erro ao inserir venda:", error);
    return;
  }

  document.getElementById("valor").value = "";
  document.getElementById("operadora").value = "";
  document.getElementById("status").value = "negociado";

  loadRelatorio(selectMes.value);
});

// ================== RELATÓRIO ==================
async function loadRelatorio(mes) {
  let query = db
    .from("vendas")
    .select(
      "id, valor, mes, status, operadora, funcionario_id, funcionarios(nome)"
    )
    .eq("funcionarios.ativo", true);

  if (mes !== "Todos") {
    query = query.eq("mes", mes);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Erro ao carregar relatório:", error);
    return;
  }

  const totais = {};
  let totalGeral = 0;

  tabelaBody.innerHTML = "";
  data.forEach((v) => {
    totais[v.funcionarios.nome] =
      (totais[v.funcionarios.nome] || 0) + Number(v.valor);
    totalGeral += Number(v.valor);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${v.funcionarios.nome}</td>
      <td>${brl(v.valor)}</td>
      <td>${v.mes}</td>
      <td>${v.operadora || "-"}</td>
      <td>${v.status}</td>
      <td>
        ${
          v.status === "negociado"
            ? `<button onclick="finalizarVenda(${v.id})">Finalizar</button>`
            : "✔️"
        }
      </td>
    `;
    tabelaBody.appendChild(tr);
  });

  totalGeralEl.textContent = brl(totalGeral);
}

// ================== FINALIZAR VENDA ==================
async function finalizarVenda(id) {
  const { error } = await db
    .from("vendas")
    .update({ status: "finalizada" })
    .eq("id", id);

  if (error) {
    console.error("Erro ao finalizar venda:", error);
    return;
  }

  loadRelatorio(selectMes.value);
}

// ================== FILTRO ==================
selectMes.addEventListener("change", () => loadRelatorio(selectMes.value));

// ================== INICIALIZAÇÃO ==================
loadFuncionarios();
loadRelatorio("Todos");

// Expõe no escopo global
window.finalizarVenda = finalizarVenda;
