export type EquipmentAdminPageLoaders<P, C, U, L> = {
  listPkgs: () => Promise<P>;
  listCatalog: () => Promise<C>;
  listUnits: (pkgId: string) => Promise<U>;
  listLoans: (pkgId: string) => Promise<L>;
};

type QueryTimeout = <T>(promise: Promise<T>) => Promise<T>;

const withoutTimeout: QueryTimeout = (promise) => promise;

/**
 * Hadkan permintaan admin kepada satu kumpulan query pada satu masa.
 *
 * Pooler production hanya menyediakan tiga sambungan bagi satu instance.
 * Menjalankan semua kumpulan serentak boleh menyebabkan query beratur pada
 * soket yang sudah tidak sah lalu menunggu sehingga fungsi Vercel tamat masa.
 */
export async function loadEquipmentAdminPageData<P, C, U, L>(
  pkgId: string,
  loaders: EquipmentAdminPageLoaders<P, C, U, L>,
  withTimeout: QueryTimeout = withoutTimeout,
) {
  const pkgs = await withTimeout(loaders.listPkgs());
  const catalog = await withTimeout(loaders.listCatalog());
  const units = await withTimeout(loaders.listUnits(pkgId));
  const loans = await withTimeout(loaders.listLoans(pkgId));

  return { pkgs, catalog, units, loans };
}
