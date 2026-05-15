const API_URL = "https://fluxus-api-gjt9.onrender.com";

export async function apiGet(endpoint: string) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }

  return response.json();
}

export async function analisarCnpj(cnpj: string) {
  return apiGet(`/analisar/${cnpj}`);
}