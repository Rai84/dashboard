const { createClient } = supabase;

// 🔑 Credenciais do Supabase
const SUPABASE_URL = "https://fprppmxfxwrswlhsxeww.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnBwbXhmeHdyc3dsaHN4ZXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzQ0OTMsImV4cCI6MjA3NDk1MDQ5M30.Wv918OkNZoFL6lAVkxX-IAxzibyA6qqnqFjZGqb0kSI";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ================= KPIs =================
async function loadKPIs() {
  const { data: negociadas } = await db
    .from("vendas")
    .select("valor")
    .eq("status", "negociado");

  const { data: finalizadas } = await db
    .from("vendas")
    .select("valor")
    .eq("status", "finalizada");

  // Atenção: confirme se o status no BD é "em analise", "em análise" ou "em_analise"
  const { data: emAbertas } = await db
    .from("vendas")
    .select("valor")
    .eq("status", "em analise");

  const totalNegociados =
    negociadas?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;

  const totalEmAberto =
    emAbertas?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;

  const qtdFinalizadas = finalizadas?.length || 0;

  const totalFinalizados =
    finalizadas?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;

  const conversao = negociadas?.length
    ? ((qtdFinalizadas / negociadas.length) * 100).toFixed(1)
    : 0;

  document.getElementById(
    "valNegociados"
  ).textContent = `R$ ${totalNegociados.toLocaleString()}`;

  document.getElementById(
    "valEmAberto"
  ).textContent = `R$ ${totalEmAberto.toLocaleString()}`;

  document.getElementById("vendasFinalizadas").textContent = qtdFinalizadas;

  document.getElementById(
    "valFinalizados"
  ).textContent = `R$ ${totalFinalizados.toLocaleString()}`;

  document.getElementById("conversao").textContent = `${conversao}%`;

  return totalFinalizados;
}

// ================= Tendência Mensal =================
async function loadTendencia() {
  const { data, error } = await db
    .from("vendas")
    .select("mes, valor")
    .eq("status", "finalizada");
  if (error) {
    console.error(error);
    return;
  }

  const agrupado = {};
  data.forEach((v) => {
    agrupado[v.mes] = (agrupado[v.mes] || 0) + Number(v.valor);
  });

  new Chart(document.getElementById("tendenciaChart"), {
    type: "line",
    data: {
      labels: Object.keys(agrupado),
      datasets: [
        {
          label: "Total R$",
          data: Object.values(agrupado),
          borderColor: "#1e3a8a",
          backgroundColor: "#3b82f6aa",
        },
      ],
    },
  });
}

// ================= Meta x Realizado =================
let metaChart;

// 🔹 Buscar meta no banco
async function getMeta() {
  const { data, error } = await db
    .from("meta")
    .select("id, valor, super_meta")
    .limit(1)
    .single();
  if (error) {
    console.error("Erro ao buscar meta:", error);
    return { id: null, valor: 15000, super_meta: 30000 }; // fallback
  }
  if (!data || data.length === 0) {
    console.warn("Nenhuma meta encontrada, usando valor padrão.");
    await db.from("meta").insert([{ valor: 15000, super_meta: 30000 }]);
    return { id: null, valor: 15000, super_meta: 30000 };
  }
  return data;
}

// 🔹 Atualizar meta no banco
async function updateMeta(novoValor, novoSuperMeta) {
  const { data: existente, error: erroBusca } = await db
    .from("meta")
    .select("id")
    .limit(1)
    .single();

  if (erroBusca) {
    console.error("Erro ao verificar meta existente:", erroBusca);
    return;
  }

  if (existente) {
    await db
      .from("meta")
      .update({
        valor: novoValor,
        super_meta: novoSuperMeta,
        atualizado_em: new Date(),
      })
      .eq("id", existente.id);
  } else {
    await db
      .from("meta")
      .insert([{ valor: novoValor, super_meta: novoSuperMeta }]);
  }
}

// 🔹 Carregar e exibir gráfico da meta
async function loadMeta() {
  const metaData = await getMeta();
  const meta = metaData?.valor || 15000;
  const superMeta = metaData?.super_meta || 30000;

  const { data, error } = await db
    .from("vendas")
    .select("valor")
    .eq("status", "finalizada");
  if (error) {
    console.error(error);
    return;
  }

  const totalRealizado = data.reduce((acc, v) => acc + Number(v.valor), 0);

  // destruir gráfico antigo se existir
  if (metaChart) {
    metaChart.destroy();
  }

  metaChart = new Chart(document.getElementById("metaChart"), {
    type: "bar",
    data: {
      labels: ["Super Meta", "Meta", "Realizado"],
      datasets: [
        {
          label: "R$",
          data: [superMeta, meta, totalRealizado],
          backgroundColor: ["#888", "#f59e0b", "#10b981"],
        },
      ],
    },
    options: { indexAxis: "y" },
  });

  document.getElementById("metaInput").value = meta;
  document.getElementById("superMetaInput").value = superMeta;
}

// 🔹 Botão para atualizar meta
document
  .getElementById("btnAtualizarMeta")
  .addEventListener("click", async () => {
    const novaMeta = Number(document.getElementById("metaInput").value) || 0;
    const novaSuperMeta =
      Number(document.getElementById("superMetaInput").value) || 0;
    await updateMeta(novaMeta, novaSuperMeta);
    await loadMeta();
    alert("Meta atualizada com sucesso!");
  });

// ================= Ticket Médio por Vendedor =================
async function loadTicketMedio() {
  const { data, error } = await db
    .from("vendas")
    // Inner join garante que `v.funcionarios` nunca será null
    .select("valor, funcionario_id, funcionarios!inner(id, nome, ativo)")
    .eq("status", "finalizada")
    .eq("funcionarios.ativo", true);

  if (error) {
    console.error("Erro no loadTicketMedio:", error);
    return;
  }

  const vendedores = {};
  for (const v of data || []) {
    const nome = v.funcionarios?.nome;
    if (!nome) continue; // segurança extra
    if (!vendedores[nome]) vendedores[nome] = { soma: 0, qtd: 0 };
    vendedores[nome].soma += Number(v.valor) || 0;
    vendedores[nome].qtd++;
  }

  const labels = Object.keys(vendedores);
  const medias = labels.map(
    (nome) => vendedores[nome].soma / vendedores[nome].qtd || 0
  );

  new Chart(document.getElementById("ticketChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Ticket Médio (R$)",
          data: medias,
          backgroundColor: "#f59e0b",
        },
      ],
    },
  });
}

// ================== PAINEL DE PROPOSTAS (VISUALIZAÇÃO) ==================
async function loadPropostasDashboard() {
  const { data, error } = await db
    .from("proposta_funcionarios")
    .select("id, quantidade, meta, funcionario_id, funcionarios!inner(nome, tipo)")
    .eq("funcionarios.tipo", "proposta");

  if (error) {
    console.error("Erro ao carregar propostas:", error);
    return;
  }

  const tbody = document.getElementById("propostasDashboardBody");
  tbody.innerHTML = "";

  let totalFeitas = 0;
  let totalMeta = 0;

  data.forEach((p) => {
    const progresso = Math.min((p.quantidade / p.meta) * 100, 100).toFixed(1);
    totalFeitas += p.quantidade;
    totalMeta += p.meta;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.funcionarios.nome}</td>
      <td>${p.quantidade}</td>
      <td>${p.meta}</td>
      <td>
        <div style="background:#ddd; border-radius:6px; height:12px; width:100px; margin:auto;">
          <div style="width:${progresso}%; height:12px; background:${
      progresso >= 100 ? "#10b981" : "#3b82f6"
    }; border-radius:6px;"></div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Total geral no rodapé
  const totalTr = document.createElement("tr");
  totalTr.innerHTML = `
    <td style="font-weight:bold;">TOTAL</td>
    <td style="font-weight:bold;">${totalFeitas}</td>
    <td style="font-weight:bold;">${totalMeta}</td>
    <td>
      <strong>${((totalFeitas / totalMeta) * 100).toFixed(1)}%</strong>
    </td>
  `;
  tbody.appendChild(totalTr);
}

// ================= Ranking de Vendedores =================
async function loadRanking() {
  const { data, error } = await db
    .from("vendas")
    .select("valor, funcionario_id, funcionarios!inner(id, nome, ativo)")
    .eq("status", "finalizada")
    .eq("funcionarios.ativo", true);

  if (error) {
    console.error("Erro no loadRanking:", error);
    return;
  }

  const totais = {};
  const qtd = {};
  for (const v of data || []) {
    const nome = v.funcionarios?.nome;
    if (!nome) continue; // segurança extra
    totais[nome] = (totais[nome] || 0) + Number(v.valor || 0);
    qtd[nome] = (qtd[nome] || 0) + 1;
  }

  const ranking = Object.entries(totais)
    .map(([nome, total]) => ({
      nome,
      total,
      ticket: total / (qtd[nome] || 1),
    }))
    .sort((a, b) => b.total - a.total);

  const rankingBody = document.getElementById("rankingBody");
  rankingBody.innerHTML = "";

  ranking.forEach((v, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}º</td>
      <td>${v.nome}</td>
      <td>R$ ${v.total.toLocaleString()}</td>
      <td>R$ ${v.ticket.toFixed(2)}</td>
    `;
    rankingBody.appendChild(tr);
  });
}

// ================= Inicializar =================
(async () => {
  await loadKPIs();
  await loadTendencia();
  await loadMeta(); // agora puxa direto do banco
  await loadTicketMedio();
  await loadRanking();
  await loadPropostasDashboard();
})();
