const { createClient } = supabase;

// 🔑 Substitua pelas suas credenciais do Supabase
const SUPABASE_URL = "https://fprppmxfxwrswlhsxeww.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnBwbXhmeHdyc3dsaHN4ZXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzQ0OTMsImV4cCI6MjA3NDk1MDQ5M30.Wv918OkNZoFL6lAVkxX-IAxzibyA6qqnqFjZGqb0kSI";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============= KPIs =================
async function loadKPIs() {
  const { data: negociadas } = await db
    .from("vendas")
    .select("valor")
    .eq("status", "negociado");
  const { data: finalizadas } = await db
    .from("vendas")
    .select("valor")
    .eq("status", "finalizada");

  const totalNegociados =
    negociadas?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;
  const qtdFinalizadas = finalizadas?.length || 0;
  const totalFinalizados =
    finalizadas?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;

  const conversao = negociadas?.length
    ? ((qtdFinalizadas / negociadas.length) * 100).toFixed(1)
    : 0;

  document.getElementById(
    "valNegociados"
  ).textContent = `R$ ${totalNegociados.toLocaleString()}`;
  document.getElementById("vendasFinalizadas").textContent = qtdFinalizadas;
  document.getElementById(
    "valFinalizados"
  ).textContent = `R$ ${totalFinalizados.toLocaleString()}`;
  document.getElementById("conversao").textContent = `${conversao}%`;

  return totalFinalizados;
}

// ============= Tendência Mensal =============
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

// ============= Meta x Realizado =============
let metaChart; // variável global para recriar o gráfico

// Meta x Realizado
async function loadMeta(meta = 15000) {
  const { data, error } = await db
    .from("vendas")
    .select("valor")
    .eq("status", "finalizada");
  if (error) {
    console.error(error);
    return;
  }

  const totalRealizado = data.reduce((acc, v) => acc + Number(v.valor), 0);

  // se já existir gráfico, destrói antes de recriar
  if (metaChart) {
    metaChart.destroy();
  }

  metaChart = new Chart(document.getElementById("metaChart"), {
    type: "bar",
    data: {
      labels: ["Meta", "Realizado"],
      datasets: [
        {
          label: "R$",
          data: [meta, totalRealizado],
          backgroundColor: ["#888", "#10b981"],
        },
      ],
    },
    options: { indexAxis: "y" },
  });
}

// Evento do botão
document.getElementById("btnAtualizarMeta").addEventListener("click", () => {
  const novaMeta = Number(document.getElementById("metaInput").value) || 0;
  loadMeta(novaMeta);
});


// ============= Ticket Médio por Vendedor =============
async function loadTicketMedio() {
  const { data, error } = await db
    .from("vendas")
    .select("valor, funcionario_id, funcionarios(nome)")
    .eq("status", "finalizada");

  if (error) {
    console.error(error);
    return;
  }

  const vendedores = {};
  data.forEach((v) => {
    const nome = v.funcionarios.nome;
    if (!vendedores[nome]) vendedores[nome] = { soma: 0, qtd: 0 };
    vendedores[nome].soma += Number(v.valor);
    vendedores[nome].qtd++;
  });

  const labels = Object.keys(vendedores);
  const medias = labels.map(
    (nome) => vendedores[nome].soma / vendedores[nome].qtd
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

  return vendedores;
}

// ============= Ranking de Vendedores =============
async function loadRanking() {
  const { data, error } = await db
    .from("vendas")
    .select("valor, funcionario_id, funcionarios(nome)")
    .eq("status", "finalizada");

  if (error) {
    console.error(error);
    return;
  }

  const totais = {};
  const qtd = {};
  data.forEach((v) => {
    const nome = v.funcionarios.nome;
    totais[nome] = (totais[nome] || 0) + Number(v.valor);
    qtd[nome] = (qtd[nome] || 0) + 1;
  });

  const ranking = Object.entries(totais)
    .map(([nome, total]) => ({
      nome,
      total,
      ticket: total / qtd[nome],
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

// ============= Inicializar =============
(async () => {
  const realizado = await loadKPIs();
  await loadTendencia();
  await loadMeta(15000); // meta fixa
  await loadTicketMedio();
  await loadRanking();
})();
