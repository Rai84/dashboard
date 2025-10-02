const { createClient } = supabase;

// 🔑 Substitua pelos seus dados do Supabase
const SUPABASE_URL = "https://fprppmxfxwrswlhsxeww.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnBwbXhmeHdyc3dsaHN4ZXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzQ0OTMsImV4cCI6MjA3NDk1MDQ5M30.Wv918OkNZoFL6lAVkxX-IAxzibyA6qqnqFjZGqb0kSI";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const formAdd = document.getElementById("formAdd");
const inputNome = document.getElementById("nome");
const tabelaBody = document.querySelector("#tabela tbody");

// Carregar funcionários
async function loadFuncionarios() {
  const { data, error } = await db
    .from("funcionarios")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  tabelaBody.innerHTML = "";
  data.forEach((f) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${f.id}</td>
      <td>
        <span id="nome-${f.id}">${f.nome}</span>
        <input id="edit-${f.id}" type="text" value="${
      f.nome
    }" style="display:none;" />
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
  if (!nome) return;

  await db.from("funcionarios").insert([{ nome }]);
  inputNome.value = "";
  loadFuncionarios();
});

// Ativar/desativar funcionário
async function toggleAtivo(id, atual) {
  await db.from("funcionarios").update({ ativo: !atual }).eq("id", id);
  loadFuncionarios();
}

// Editar funcionário
function editarFuncionario(id) {
  const span = document.getElementById(`nome-${id}`);
  const input = document.getElementById(`edit-${id}`);

  if (input.style.display === "none") {
    // Modo edição
    span.style.display = "none";
    input.style.display = "inline-block";
    input.focus();

    input.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        const novoNome = input.value.trim();
        if (novoNome) {
          await db.from("funcionarios").update({ nome: novoNome }).eq("id", id);
          loadFuncionarios();
        }
      }
    });
  }
}

// Expor no escopo global
window.toggleAtivo = toggleAtivo;
window.editarFuncionario = editarFuncionario;

// Carregar ao abrir
loadFuncionarios();
