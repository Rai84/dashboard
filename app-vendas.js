const formVenda = document.getElementById("formVenda");
const selectFuncionario = document.getElementById("funcionario");
const selectMes = document.getElementById("filtroMes");
const tabelaBody = document.querySelector("#tabelaVendas tbody");
const totalGeralEl = document.getElementById("totalGeral");

// ================== FORMATAR MOEDA ==================
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

  tabelaBody.innerHTML = "";
  let totalGeral = 0;

  data.forEach((v) => {
    totalGeral += Number(v.valor);

    let botoesStatus = "";
    if (v.status === "negociado") {
      botoesStatus = `
        <button onclick="vendaEmAnalise(${v.id})">Em Análise</button>
        <button onclick="finalizarVenda(${v.id})">Finalizar</button>
      `;
    } else if (v.status === "em analise") {
      botoesStatus = `
        <button onclick="finalizarVenda(${v.id})">Aprovar</button>
        <button onclick="voltarNegociado(${v.id})">Voltar p/ Negociado</button>
      `;
    } else if (v.status === "finalizada") {
      botoesStatus = `<button onclick="voltarNegociado(${v.id})">Reabrir</button>`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${v.funcionarios.nome}</td>
      <td>${brl(v.valor)}</td>
      <td>${v.mes}</td>
      <td>${v.operadora || "-"}</td>
      <td>${v.status}</td>
      <td>
        ${botoesStatus}
        <button onclick="editarVenda(${v.id}, '${v.funcionarios.nome}', ${
      v.valor
    }, '${v.mes}', '${v.operadora || ""}')">Editar</button>
        <button onclick="deletarVenda(${
          v.id
        })" style="color:red;">Excluir</button>
      </td>
    `;
    tabelaBody.appendChild(tr);
  });

  totalGeralEl.textContent = brl(totalGeral);
}

// ================== ATUALIZA STATUS ==================
async function atualizarStatus(id, novoStatus) {
  const { error } = await db
    .from("vendas")
    .update({ status: novoStatus })
    .eq("id", id);

  if (error) {
    console.error(`Erro ao atualizar status para ${novoStatus}:`, error);
    return;
  }

  loadRelatorio(selectMes.value);
}

// ================== AÇÕES DE STATUS ==================
function finalizarVenda(id) {
  atualizarStatus(id, "finalizada");
}

function vendaEmAnalise(id) {
  atualizarStatus(id, "em analise");
}

function voltarNegociado(id) {
  atualizarStatus(id, "negociado");
}

// ================== EDITAR VENDA ==================
async function editarVenda(
  id,
  nomeFuncionario,
  valorAtual,
  mesAtual,
  operadoraAtual
) {
  const novoValor = prompt("Novo valor:", valorAtual);
  if (novoValor === null) return;

  const novoMes = prompt("Novo mês:", mesAtual);
  if (novoMes === null) return;

  const novaOperadora = prompt("Nova operadora:", operadoraAtual);
  if (novaOperadora === null) return;

  // Selecionar novo funcionário (opcional)
  const funcionarios = await db
    .from("funcionarios")
    .select("id, nome")
    .eq("ativo", true);
  if (funcionarios.error) {
    console.error(funcionarios.error);
    return;
  }

  const lista = funcionarios.data.map((f) => `${f.id} - ${f.nome}`).join("\n");
  const novoFuncionarioId = prompt(
    `Novo funcionário (ID atual: ${nomeFuncionario})\n${lista}\nDigite o ID:`
  );
  if (novoFuncionarioId === null) return;

  const { error } = await db
    .from("vendas")
    .update({
      valor: Number(novoValor),
      mes: novoMes,
      operadora: novaOperadora,
      funcionario_id: novoFuncionarioId || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao editar venda:", error);
    return;
  }

  alert("Venda atualizada com sucesso!");
  loadRelatorio(selectMes.value);
}

// ================== DELETAR VENDA ==================
async function deletarVenda(id) {
  if (!confirm("Tem certeza que deseja excluir esta venda?")) return;

  const { error } = await db.from("vendas").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir venda:", error);
    return;
  }

  alert("Venda excluída com sucesso!");
  loadRelatorio(selectMes.value);
}

// ================= FUNCIONÁRIAS DE PROPOSTA =================
async function loadPropostas() {
  const { data, error } = await db
    .from("proposta_funcionarios")
    .select("id, quantidade, meta, funcionario_id, funcionarios!inner(nome, tipo)")
    .eq("funcionarios.tipo", "proposta")
    .order("id", { ascending: true });

    

  if (error) {
    console.error("Erro ao carregar proposta:", error);
    return;
  }

  const tbody = document.getElementById("propostasBody");
  tbody.innerHTML = "";

  data.forEach((p) => {
    const progresso = Math.min((p.quantidade / p.meta) * 100, 100).toFixed(1);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.funcionarios.nome}</td>
      <td>${p.quantidade}</td>
      <td>${p.meta}</td>
      <td>
        <div style="background:#ddd; border-radius:6px; height:12px; width:100px;">
          <div style="width:${progresso}%; height:12px; background:${
      progresso >= 100 ? "#10b981" : "#3b82f6"
    }; border-radius:6px;"></div>
        </div>
      </td>
      <td><button onclick="alterarProposta(${p.id}, 1)">+</button></td>
      <td><button onclick="alterarProposta(${p.id}, -1)">-</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// ================= ALTERAR PROPOSTA (+ / -) =================

async function alterarProposta(id, delta) {
  const { data, error } = await db
    .from("proposta_funcionarios")
    .select("quantidade, meta")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar proposta:", error);
    return;
  }

  let novaQtd = data.quantidade + delta;
  if (novaQtd < 0) novaQtd = 0;

  const { error: updateError } = await db
    .from("proposta_funcionarios")
    .update({ quantidade: novaQtd, atualizado_em: new Date() })
    .eq("id", id);

  if (updateError) {
    console.error("Erro ao atualizar proposta:", updateError);
    return;
  }

  if (novaQtd === data.meta && delta > 0) {
    alert("🎉 Meta de propostas atingida! Parabéns!");
  }

  loadPropostas(); // recarrega tabela
}

window.alterarProposta = alterarProposta;



// ================== FILTRO ==================
selectMes.addEventListener("change", () => loadRelatorio(selectMes.value));

// ================== INICIALIZAÇÃO ==================
loadFuncionarios();
loadRelatorio("Todos");
loadPropostas();

// Tornar funções globais
window.finalizarVenda = finalizarVenda;
window.vendaEmAnalise = vendaEmAnalise;
window.voltarNegociado = voltarNegociado;
window.editarVenda = editarVenda;
window.deletarVenda = deletarVenda;
