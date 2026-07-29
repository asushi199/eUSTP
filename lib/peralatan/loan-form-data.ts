export type EquipmentLoanFormLoaders<C, P, S> = {
  listCatalog: () => Promise<C>;
  listPkgs: () => Promise<P>;
  listSchools: () => Promise<S>;
};

type QueryTimeout = <T>(promise: Promise<T>) => Promise<T>;

const withoutTimeout: QueryTimeout = (promise) => promise;

/**
 * Muatkan borang pinjaman secara berurutan.
 *
 * Production pooler hanya ~3 sambungan per instance. Promise.all di halaman
 * /tempahan/peralatan/mohon pernah tergantung sehingga had 5 minit Vercel.
 */
export async function loadEquipmentLoanFormData<C, P, S>(
  loaders: EquipmentLoanFormLoaders<C, P, S>,
  withTimeout: QueryTimeout = withoutTimeout,
) {
  const items = await withTimeout(loaders.listCatalog());
  const pkgs = await withTimeout(loaders.listPkgs());
  const schools = await withTimeout(loaders.listSchools());
  return { items, pkgs, schools };
}
