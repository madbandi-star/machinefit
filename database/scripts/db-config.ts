function useSsl(connectionString: string): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    connectionString.includes('supabase.co') ||
    connectionString.includes('supabase.com') ||
    process.env.DATABASE_SSL === 'true'
  );
}

export function createPoolConfig(connectionString: string) {
  return {
    connectionString,
    ssl: useSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  };
}
