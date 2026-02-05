// lib/api.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestOptions,
): Promise<T> {
  const { token, headers, ...restOptions } = options || {};

  const config: RequestInit = {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || "Something went wrong");
  }

  return response.json() as Promise<T>;
}

// You might want to define specific API functions here later
// export const authApi = {
//   login: (credentials: any) => apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
//   register: (data: any) => apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
// };

// export const productApi = {
//   getAll: () => apiRequest("/api/products"),
//   getById: (id: string) => apiRequest(`/api/products/${id}`),
//   create: (productData: any, token: string) => apiRequest("/api/products", {
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${token}`,
//       "X-User-ID": "1", // Placeholder, will get from auth context
//       "X-User-Roles": "ADMIN", // Placeholder, will get from auth context
//     },
//     body: JSON.stringify(productData),
//   }),
// };
