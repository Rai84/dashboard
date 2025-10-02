const formAdd = document.getElementById("formAdd");
const inputNome = document.getElementById("nome");
const selectTipo = document.getElementById("tipo");
const tabelaBody = document.querySelector("#tabela tbody");

// Carregar funcionários
async function loadFuncionarios() {
  const { data, error } = await db
    .from("funcionarios")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Erro ao carregar funcionários:", error);
    return;
  }

  tabelaBody.innerHTML = "";

  if (!data || data.length === 0) {
    tabelaBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color:#888;">
          Nenhum funcionário encontrado
        </td>
      </tr>
    `;
    return;
  }

  data.forEach((f) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td>${f.id}</td>
    <td>
      <span id="nome-${f.id}">${f.nome}</span>
      <input id="edit-nome-${f.id}" type="text" value="${
      f.nome
    }" style="display:none;" />
    </td>
    <td>
      <span id="tipo-${f.id}">${f.tipo}</span>
      <select id="edit-tipo-${f.id}" style="display:none;">
        <option value="vendedora" ${
          f.tipo === "vendedora" ? "selected" : ""
        }>Vendedora</option>
        <option value="proposta" ${
          f.tipo === "proposta" ? "selected" : ""
        }>Proposta</option>
      </select>
    </td>
    <td>${f.ativo ? "Ativo ✅" : "Inativo ❌"}</td>
    <td>
      <button class="acao editar" onclick="editarFuncionario(${
        f.id
      })">Editar</button>
      <button class="acao ${
        f.ativo ? "desativar" : "ativar"
      }" onclick="toggleAtivo(${f.id}, ${f.ativo})">
        ${f.ativo ? "Desativar" : "Ativar"}
      </button>
    </td>
  `;
    tabelaBody.appendChild(tr);
  });
}

// Adicionar funcionário
formAdd.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = inputNome.value.trim();
  const tipo = selectTipo.value;

  if (!nome || !tipo) return;

  const { error } = await db.from("funcionarios").insert([{ nome, tipo }]);
  if (error) {
    console.error("Erro ao inserir:", error);
    return;
  }

  inputNome.value = "";
  selectTipo.value = "";
  loadFuncionarios();
});

// Ativar/desativar funcionário
async function toggleAtivo(id, atual) {
  const { error } = await db
    .from("funcionarios")
    .update({ ativo: !atual })
    .eq("id", id);
  if (error) console.error("Erro ao atualizar ativo:", error);
  loadFuncionarios();
}

// Editar nome do funcionário
function editarFuncionario(id) {
  const spanNome = document.getElementById(`nome-${id}`);
  const inputNome = document.getElementById(`edit-nome-${id}`);
  const spanTipo = document.getElementById(`tipo-${id}`);
  const selectTipo = document.getElementById(`edit-tipo-${id}`);

  const editando = inputNome.style.display !== "none";

  if (!editando) {
    // Modo edição
    spanNome.style.display = "none";
    inputNome.style.display = "inline-block";
    spanTipo.style.display = "none";
    selectTipo.style.display = "inline-block";
    inputNome.focus();

    // Salvar com Enter
    inputNome.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        await salvarEdicao(id, inputNome.value.trim(), selectTipo.value);
      }
    });

    selectTipo.addEventListener("change", async () => {
      await salvarEdicao(id, inputNome.value.trim(), selectTipo.value);
    });
  }
}

async function salvarEdicao(id, novoNome, novoTipo) {
  if (!novoNome || !novoTipo) return;

  const { error } = await db
    .from("funcionarios")
    .update({ nome: novoNome, tipo: novoTipo })
    .eq("id", id);

  if (error) console.error("Erro ao editar:", error);
  loadFuncionarios();
}


// Expor no escopo global
window.toggleAtivo = toggleAtivo;
window.editarFuncionario = editarFuncionario;

// Inicializar
loadFuncionarios();
