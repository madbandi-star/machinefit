export function getPagination(page: number, limit: number) {
  const offset = (page - 1) * limit;
  return { offset, limit };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
