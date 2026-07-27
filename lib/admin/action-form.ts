export function getActionFormSubmitLabel(pending: boolean, submitLabel: string) {
  return pending ? "Menyimpan..." : submitLabel;
}

type ActionFormResult = { ok: boolean; error?: string };

export async function runActionFormAction(
  action: (formData: FormData) => Promise<ActionFormResult>,
  formData: FormData,
): Promise<ActionFormResult> {
  try {
    return await action(formData);
  } catch {
    return {
      ok: false,
      error: "Tindakan tidak dapat diselesaikan. Sila cuba semula.",
    };
  }
}
