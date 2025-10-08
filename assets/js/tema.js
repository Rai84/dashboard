document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const btn = document.getElementById("btnTema");

  // Carregar preferência anterior
  const temaSalvo = localStorage.getItem("tema") || "light";
  body.classList.add(temaSalvo);

  // Alternar tema
  btn.addEventListener("click", () => {
    const novoTema = body.classList.contains("light") ? "dark" : "light";
    body.classList.remove("light", "dark");
    body.classList.add(novoTema);
    localStorage.setItem("tema", novoTema);
  });
});
