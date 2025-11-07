export default async function fetcher(url: string) {
  const res = await authFetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  
  return res.json();
}
